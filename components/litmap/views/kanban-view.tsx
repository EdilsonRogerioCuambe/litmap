"use client"

import { useMemo, useState, useCallback } from "react"
import { DragDropContext, DropResult } from "@hello-pangea/dnd"
import { useStore } from "@/lib/store"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowRight, X } from "lucide-react"

import { KanbanHeader } from "../kanban/kanban-header"
import { ScreeningProgressBar } from "../kanban/screening-progress-bar"
import { KanbanColumn } from "../kanban/kanban-column"
import { BulkActionsToolbar } from "../kanban/bulk-actions-toolbar"
import { DuplicateFinderModal } from "../kanban/duplicate-finder-modal"
import { RetractionModal } from "../kanban/retraction-modal"
import type { RetractionInfo } from "../kanban/retraction-modal"

import { AddReferenceModal, ReferenceDetailModal } from "../reference-modal"
import { ExclusionModal } from "../exclusion-modal"

import {
  moveReferenceAction,
  updateReferenceAction,
  deleteReferenceAction,
  bulkUpdateReferencesAction,
} from "@/lib/actions/reference"
import type { Reference, Stage, ExclusionCategory } from "@/lib/types"
import { STAGE_LABELS } from "@/lib/types"

const PAGE_SIZE = 25

// ─── Main Kanban View ─────────────────────────────────────────────────────────

export function KanbanView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { state, moveReference, updateReference, deleteReference } = useStore()
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [visibleCounts, setVisibleCounts] = useState<Record<Stage, number>>({
    identification: PAGE_SIZE,
    screening: PAGE_SIZE,
    eligibility: PAGE_SIZE,
    included: PAGE_SIZE,
    excluded: PAGE_SIZE,
  })

  // --- Selection ---
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // --- Modals ---
  const [openAdd, setOpenAdd] = useState(false)
  const [detailRef, setDetailRef] = useState<Reference | null>(null)
  const [exclusion, setExclusion] = useState<{ refId: string; targetStage: Stage } | null>(null)
  const [showDuplicateFinder, setShowDuplicateFinder] = useState(false)
  const [retractionTarget, setRetractionTarget] = useState<Reference | null>(null)

  // --- Derived ---
  const databases = useMemo(() => {
    const set = new Set<string>()
    state.references.forEach((r) => r.database && set.add(r.database))
    return Array.from(set).sort()
  }, [state.references])

  const columns = useMemo(() => {
    const stages: Stage[] = ["identification", "screening", "eligibility", "included", "excluded"]
    return stages.map((s) => ({
      id: s,
      refs: state.references.filter((r) => r.stage === s),
    }))
  }, [state.references])

  // --- Progress bar stats ---
  const stats = useMemo(() => {
    const stages: Stage[] = ["identification", "screening", "eligibility", "included"]
    const total = state.references.length

    return stages.map((s) => {
      let entered = 0
      let left = 0

      if (s === "identification") {
        entered = total
        left = state.references.filter((r) => r.stage !== "identification").length
      } else if (s === "screening") {
        entered = state.references.filter((r) => r.stage !== "identification").length
        left = entered - state.references.filter((r) => r.stage === "screening").length
      } else if (s === "eligibility") {
        entered = state.references.filter(
          (r) =>
            ["eligibility", "included"].includes(r.stage) ||
            (r.stage === "excluded" &&
              r.exclusionCategory !== "Remoção por Título" &&
              r.exclusionCategory !== "Remoção por Resumo")
        ).length
        left = entered - state.references.filter((r) => r.stage === "eligibility").length
      }

      const percentage = entered > 0 ? Math.round((left / entered) * 100) : 0
      return { stage: s, entered, left, percentage }
    })
  }, [state.references])

  // --- Handlers ---
  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, source, destination } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId) return

    const targetStage = destination.droppableId as Stage
    const refId = draggableId

    if (targetStage === "excluded") {
      setExclusion({ refId, targetStage })
    } else {
      const toastId = toast.loading(`A mover para ${targetStage}...`)
      const originalRef = state.references.find((r) => r.id === refId)
      moveReference(refId, targetStage)

      try {
        await moveReferenceAction(slug, refId, targetStage)
        toast.success("Movido com sucesso", { id: toastId })
      } catch (err: unknown) {
        if (originalRef) moveReference(refId, originalRef.stage)
        const message = err instanceof Error ? err.message : "Erro desconhecido"
        toast.error("Erro ao mover: " + message, { id: toastId })
      }
    }
  }

  const confirmExclusion = async (cat: ExclusionCategory, reason: string) => {
    if (!exclusion) return
    const { refId, targetStage } = exclusion
    const toastId = toast.loading("A excluir referência...")
    const originalRef = state.references.find((r) => r.id === refId)

    moveReference(refId, targetStage, { exclusionCategory: cat, exclusionReason: reason })

    try {
      await moveReferenceAction(slug, refId, targetStage, { exclusionCategory: cat, exclusionReason: reason })
      toast.success("Excluída com sucesso", { id: toastId })
    } catch (err: unknown) {
      if (originalRef) moveReference(refId, originalRef.stage)
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      toast.error("Erro ao excluir: " + message, { id: toastId })
    }
    setExclusion(null)
  }

  const handleUpdateQuality = async (id: string, score: number) => {
    const originalRef = state.references.find((r) => r.id === id)
    updateReference(id, { qualityScore: score })
    try {
      await updateReferenceAction(slug, id, { qualityScore: score })
    } catch {
      if (originalRef) updateReference(id, { qualityScore: originalRef.qualityScore })
      toast.error("Erro ao actualizar qualidade")
    }
  }

  const handleMove = async (refId: string, targetStage: Stage) => {
    const originalRef = state.references.find((r) => r.id === refId)
    const toastId = toast.loading(`A mover para ${STAGE_LABELS[targetStage]}...`)
    moveReference(refId, targetStage)

    try {
      await moveReferenceAction(slug, refId, targetStage)
      toast.success("Movido com sucesso", { id: toastId })
    } catch (err: unknown) {
      if (originalRef) moveReference(refId, originalRef.stage)
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      toast.error("Erro ao mover: " + message, { id: toastId })
    }
  }

  const handleDelete = async (ref: Reference) => {
    if (!confirm(`Tens a certeza que queres eliminar permanentemente "${ref.title}"?`)) return
    const toastId = toast.loading("A eliminar...")
    try {
      await deleteReferenceAction(slug, ref.id)
      deleteReference(ref.id)
      toast.success("Eliminado com sucesso", { id: toastId })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      toast.error("Erro ao eliminar: " + message, { id: toastId })
    }
  }

  const handleQuickExclude = useCallback(async (refId: string, cat: ExclusionCategory, reason: string) => {
    const originalRef = state.references.find((r) => r.id === refId)
    const toastId = toast.loading("A excluir...")
    moveReference(refId, "excluded", { exclusionCategory: cat, exclusionReason: reason })
    try {
      await moveReferenceAction(slug, refId, "excluded", { exclusionCategory: cat, exclusionReason: reason })
      toast.success("Excluída com sucesso", { id: toastId })
    } catch (err: unknown) {
      if (originalRef) moveReference(refId, originalRef.stage)
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      toast.error("Erro ao excluir: " + message, { id: toastId })
    }
  }, [slug, moveReference, state.references])

  const handleSelect = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id))
    }
  }

  const handleBulkMove = async (target: Stage) => {
    if (selectedIds.length === 0) return
    const toastId = toast.loading(`A mover ${selectedIds.length} referências...`)
    selectedIds.forEach((id) => moveReference(id, target))

    try {
      await bulkUpdateReferencesAction(slug, selectedIds, { stage: target })
      toast.success("Actualização em massa concluída", { id: toastId })
      setSelectedIds([])
      setSelectionMode(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      toast.error("Erro na actualização em massa: " + message, { id: toastId })
      router.refresh()
    }
  }

  const handleBulkExclude = async (cat: ExclusionCategory) => {
    if (selectedIds.length === 0) return
    const toastId = toast.loading(`A excluir ${selectedIds.length} referências...`)
    selectedIds.forEach((id) =>
      moveReference(id, "excluded", { exclusionCategory: cat, exclusionReason: "Exclusão em massa" })
    )

    try {
      await bulkUpdateReferencesAction(slug, selectedIds, {
        stage: "excluded",
        exclusionCategory: cat,
        exclusionReason: "Exclusão em massa",
      })
      toast.success("Exclusão em massa concluída", { id: toastId })
      setSelectedIds([])
      setSelectionMode(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      toast.error("Erro na exclusão em massa: " + message, { id: toastId })
      router.refresh()
    }
  }

  // Bulk advance all refs from one stage to the next
  const handleBulkAdvance = useCallback(async (from: Stage, to: Stage) => {
    const toAdvance = state.references
      .filter((r) => r.stage === from)
      .map((r) => r.id)

    if (toAdvance.length === 0) return
    const toastId = toast.loading(`A mover ${toAdvance.length} referências de ${from} → ${to}...`)
    toAdvance.forEach((id) => moveReference(id, to))

    try {
      await bulkUpdateReferencesAction(slug, toAdvance, { stage: to })
      toast.success(`${toAdvance.length} referências movidas para ${to}!`, { id: toastId })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      toast.error("Erro: " + message, { id: toastId })
      router.refresh()
    }
  }, [state.references, slug, moveReference, router])

  // Retraction handler
  const handleConfirmRetraction = useCallback(async (info: RetractionInfo) => {
    if (!retractionTarget) return
    const ref = retractionTarget
    const toastId = toast.loading("A registar retratação...")

    const reason = [
      info.retractionReason,
      info.retractionDate ? `Data: ${info.retractionDate}` : null,
      info.retractionUrl ? `URL: ${info.retractionUrl}` : null,
    ].filter(Boolean).join(" | ")

    moveReference(ref.id, "excluded", {
      exclusionCategory: "Artigo Retratado",
      exclusionReason: reason,
    })

    try {
      await moveReferenceAction(slug, ref.id, "excluded", {
        exclusionCategory: "Artigo Retratado",
        exclusionReason: reason,
      })
      toast.success("Artigo marcado como retratado", { id: toastId })
    } catch (err: unknown) {
      moveReference(ref.id, ref.stage)
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      toast.error("Erro: " + message, { id: toastId })
    }
    setRetractionTarget(null)
  }, [retractionTarget, slug, moveReference])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    // calc(100vh - 64px) = full viewport minus topbar height (h-16 = 64px)
    // This avoids fighting with the layout's overflow-y-auto main container
    <div className="flex flex-col bg-[#FAF8F4]" style={{ height: "calc(100vh - 64px)" }}>
      <KanbanHeader
        onAddReference={() => setOpenAdd(true)}
        onOpenDuplicateFinder={() => setShowDuplicateFinder(true)}
      />

      <ScreeningProgressBar stats={stats} />

        {/* Kanban board: scroll both axes independently inside here */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 min-h-0">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-5 h-full items-start">
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                stage={col.id}
                references={col.refs}
                visibleCount={visibleCounts[col.id]}
                onLoadMore={(s) =>
                  setVisibleCounts((prev) => ({ ...prev, [s]: prev[s] + PAGE_SIZE }))
                }
                selectionMode={selectionMode}
                onToggleSelectionMode={() => setSelectionMode(!selectionMode)}
                selectedIds={selectedIds}
                slug={slug}
                onSelect={handleSelect}
                onDetail={setDetailRef}
                onOpenPage={(id) => onNavigate(`references/${id}`)}
                onMove={handleMove}
                onQuickExclude={handleQuickExclude}
                onCustomExclude={(id) => setExclusion({ refId: id, targetStage: "excluded" })}
                onDelete={handleDelete}
                onUpdateQuality={handleUpdateQuality}
                onMarkRetracted={(ref) => setRetractionTarget(ref)}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      <BulkActionsToolbar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onMove={handleBulkMove}
        onExclude={handleBulkExclude}
        onExport={() => toast.info("Exportação em massa em breve")}
      />

      {/* Duplicate finder */}
      {showDuplicateFinder && (
        <DuplicateFinderModal
          slug={slug}
          onClose={() => setShowDuplicateFinder(false)}
        />
      )}

      {/* Retraction modal */}
      <RetractionModal
        open={!!retractionTarget}
        onOpenChange={(o) => !o && setRetractionTarget(null)}
        referenceTitle={retractionTarget?.title ?? ""}
        onConfirm={handleConfirmRetraction}
      />

      {/* Other modals */}
      <AddReferenceModal open={openAdd} onOpenChange={setOpenAdd} />
      {detailRef && (
        <ReferenceDetailModal
          reference={detailRef}
          open={!!detailRef}
          onOpenChange={(o) => !o && setDetailRef(null)}
          onMove={handleMove}
          onQuickExclude={handleQuickExclude}
        />
      )}
      <ExclusionModal
        open={!!exclusion}
        onOpenChange={(o) => !o && setExclusion(null)}
        onConfirm={confirmExclusion}
      />
    </div>
  )
}
