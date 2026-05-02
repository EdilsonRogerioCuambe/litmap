"use client"

import { useMemo, useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddReferenceModal, ReferenceDetailModal } from "../reference-modal"
import { ExclusionModal } from "../exclusion-modal"
import {
  Star,
  X,
  ArrowRightLeft,
  MoreHorizontal,
  Eye,
  ExternalLink,
  Trash2,
  ChevronDown,
} from "lucide-react"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd"
import type { ExclusionCategory, Reference, Stage } from "@/lib/types"
import { STAGE_COLORS, STAGE_LABELS, STAGES } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { useParams, useRouter } from "next/navigation"
import { updateReferenceAction, moveReferenceAction, deleteReferenceAction } from "@/lib/actions/reference"

const PAGE_SIZE = 25

export function KanbanView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { state, moveReference, deleteReference, updateReference } = useStore()
  const [openAdd, setOpenAdd] = useState(false)
  const [detailRef, setDetailRef] = useState<Reference | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Reference | null>(null)
  const [exclusion, setExclusion] = useState<{ refId: string } | null>(null)

  const [search, setSearch] = useState("")
  const [dbFilter, setDbFilter] = useState<string>("__all")
  const [yearMin, setYearMin] = useState("")
  const [yearMax, setYearMax] = useState("")
  const [methodologyFilter, setMethodologyFilter] = useState("__all")

  // Pagination state per stage
  const [pages, setPages] = useState<Record<Stage, number>>({
    identification: 1,
    screening: 1,
    eligibility: 1,
    included: 1,
    excluded: 1,
  })

  // Reset pages on filter change
  useEffect(() => {
    setPages({ identification: 1, screening: 1, eligibility: 1, included: 1, excluded: 1 })
  }, [search, dbFilter, yearMin, yearMax, methodologyFilter])

  const allDatabases = useMemo(() => {
    const set = new Set<string>()
    state.references.forEach((r) => r.database && set.add(r.database))
    return Array.from(set).sort()
  }, [state.references])

  const filtered = useMemo(() => {
    return state.references.filter((r) => {
      if (search) {
        const q = search.toLowerCase()
        const hay =
          r.title +
          " " +
          r.authors.join(" ") +
          " " +
          (r.abstractNote || "") +
          " " +
          (r.journal || "")
        if (!hay.toLowerCase().includes(q)) return false
      }
      if (dbFilter !== "__all" && r.database !== dbFilter) return false
      if (yearMin && r.year && r.year < parseInt(yearMin, 10)) return false
      if (yearMax && r.year && r.year > parseInt(yearMax, 10)) return false
      if (methodologyFilter !== "__all") {
        const ext = state.extractions.find((e) => e.referenceId === r.id)
        if (!ext || ext.methodology !== methodologyFilter) return false
      }
      return true
    })
  }, [state.references, state.extractions, search, dbFilter, yearMin, yearMax, methodologyFilter])

  const byStage = useMemo(() => {
    const groups: Record<Stage, Reference[]> = {
      identification: [],
      screening: [],
      eligibility: [],
      included: [],
      excluded: [],
    }
    filtered.forEach((r) => groups[r.stage].push(r))
    return groups
  }, [filtered])

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const refId = result.draggableId
    const target = result.destination.droppableId as Stage
    const ref = state.references.find((r) => r.id === refId)
    if (!ref || ref.stage === target) return
    if (target === "excluded") {
      setExclusion({ refId })
      return
    }
    const originalStage = ref.stage
    moveReference(refId, target)
    try {
      await moveReferenceAction(slug, refId, target)
      toast.success(`Movido para ${STAGE_LABELS[target]}.`)
    } catch (err: any) {
      moveReference(refId, originalStage)
      toast.error("Erro ao mover: " + err.message)
    }
  }

  const confirmExclusion = async (cat: ExclusionCategory, reason: string) => {
    if (!exclusion) return
    const originalStage = state.references.find((r) => r.id === exclusion.refId)?.stage
    moveReference(exclusion.refId, "excluded", {
      exclusionCategory: cat,
      exclusionReason: reason,
    })
    try {
      await moveReferenceAction(slug, exclusion.refId, "excluded", { exclusionCategory: cat, exclusionReason: reason })
      toast.success("Referência excluída.")
    } catch (err: any) {
      if (originalStage) moveReference(exclusion.refId, originalStage)
      toast.error("Erro ao excluir: " + err.message)
    }
    setExclusion(null)
  }

  const loadMore = (stage: Stage) => {
    setPages((prev) => ({ ...prev, [stage]: prev[stage] + 1 }))
  }

  return (
    <>
      {/* Board Summary */}
      <div className="px-8 py-4 bg-[#FAF9F6] border-b border-[#E5E2DA] flex items-center gap-6 overflow-x-auto">
        {STAGES.map((s) => (
          <div key={s} className="flex flex-col gap-0.5 min-w-[120px]">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#A1A1AA]">
              {STAGE_LABELS[s]}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-serif font-semibold text-[#444444]">
                {byStage[s].length}
              </span>
              <span className="text-[10px] text-[#A1A1AA]">
                {state.references.length > 0
                  ? `${Math.round((byStage[s].length / state.references.length) * 100)}%`
                  : "0%"}
              </span>
            </div>
            <div className="w-full h-1 bg-[#E5E2DA] rounded-full overflow-hidden mt-1">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${(byStage[s].length / (state.references.length || 1)) * 100}%`,
                  background: STAGE_COLORS[s].border,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto bg-[#F5F2ED] custom-scrollbar">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 p-8 min-w-max h-full items-start">
            {STAGES.map((stage) => {
              const list = byStage[stage]
              const sc = STAGE_COLORS[stage]
              const visibleCount = pages[stage] * PAGE_SIZE
              const visible = list.slice(0, visibleCount)
              const remaining = list.length - visible.length

              return (
                <div key={stage} className="w-[320px] shrink-0 flex flex-col max-h-full">
                  {/* Column header */}
                  <div className="mb-4 px-4 py-3 rounded-xl bg-white border border-[#E5E2DA] shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                        style={{ background: sc.border }}
                      />
                      <h3 className="font-serif text-lg text-[#2D2D2D]">{STAGE_LABELS[stage]}</h3>
                    </div>
                    <Badge
                      className="text-[11px] font-mono font-medium rounded-lg border-0"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {list.length}
                    </Badge>
                  </div>

                  <Droppable droppableId={stage}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "flex-1 rounded-2xl p-2 space-y-3 transition-all duration-300 min-h-[500px]",
                          snapshot.isDraggingOver
                            ? "bg-[#E5E2DA]/30 ring-2 ring-inset ring-[#E5E2DA]/50"
                            : "bg-transparent",
                        )}
                      >
                        {list.length === 0 && (
                          <div className="text-center py-12 px-6">
                            <div className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-3 border border-dashed border-[#A1A1AA]/30">
                              <ArrowRightLeft className="w-5 h-5 text-[#A1A1AA]/40" />
                            </div>
                            <p className="text-xs text-[#A1A1AA] italic leading-relaxed">
                              Arraste artigos para esta fase para avançar no seu mapeamento sistemático.
                            </p>
                          </div>
                        )}

                        {visible.map((r, idx) => (
                          <Draggable key={r.id} draggableId={r.id} index={idx}>
                            {(p, snap) => (
                              <div
                                ref={p.innerRef}
                                {...p.draggableProps}
                                {...p.dragHandleProps}
                                className={cn(
                                  "group bg-white rounded-2xl p-4 cursor-grab active:cursor-grabbing transition-all duration-200 border border-transparent border-l-[4px]",
                                  snap.isDragging
                                    ? "shadow-[0_20px_50px_rgba(0,0,0,0.15)] scale-[1.02]"
                                    : "shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:border-r-[#E5E2DA] hover:border-t-[#E5E2DA] hover:border-b-[#E5E2DA]",
                                  r.stage === "excluded" && "opacity-80 hover:opacity-100",
                                )}
                                style={{ borderLeftColor: sc.border }}
                              >
                                {/* Top row: stars + database tag + 3-dot menu */}
                                <div className="flex justify-between items-start gap-2 mb-2">
                                  <Stars
                                    value={r.qualityScore || 0}
                                    onChange={async (v) => {
                                      const originalScore = r.qualityScore
                                      updateReference(r.id, { qualityScore: v })
                                      try {
                                        await updateReferenceAction(slug, r.id, { qualityScore: v })
                                      } catch (err: any) {
                                        updateReference(r.id, { qualityScore: originalScore })
                                        toast.error("Erro ao atualizar qualidade")
                                      }
                                    }}
                                  />
                                  <div className="flex items-center gap-1.5">
                                    {r.database && (
                                      <span className="text-[9px] uppercase tracking-widest font-bold text-[#A1A1AA] bg-[#FAF9F6] px-1.5 py-0.5 rounded border border-[#E5E2DA]">
                                        {r.database}
                                      </span>
                                    )}
                                    {/* 3-dot menu */}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="w-7 h-7 text-[#A1A1AA] hover:text-[#1C1C1E] hover:bg-[#F5F2ED] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="end"
                                        className="w-52 rounded-xl shadow-xl border-[#E5E2DA]"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {/* View */}
                                        <DropdownMenuItem
                                          className="gap-2 text-xs"
                                          onClick={() => setDetailRef(r)}
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          Ver detalhes
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="gap-2 text-xs"
                                          onClick={() =>
                                            router.push(`/projects/${slug}/references/${r.id}`)
                                          }
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                          Abrir página completa
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        {/* Move to */}
                                        <DropdownMenuSub>
                                          <DropdownMenuSubTrigger className="gap-2 text-xs">
                                            <ArrowRightLeft className="w-3.5 h-3.5" />
                                            Mover para...
                                          </DropdownMenuSubTrigger>
                                          <DropdownMenuSubContent className="rounded-xl border-[#E5E2DA]">
                                            {STAGES.filter((s) => s !== r.stage).map((s) => (
                                              <DropdownMenuItem
                                                key={s}
                                                className="gap-2 text-xs"
                                                onClick={async () => {
                                                  if (s === "excluded") {
                                                    setExclusion({ refId: r.id })
                                                  } else {
                                                    const originalStage = r.stage
                                                    moveReference(r.id, s)
                                                    try {
                                                      await moveReferenceAction(slug, r.id, s)
                                                      toast.success(`Movido para ${STAGE_LABELS[s]}.`)
                                                    } catch (err: any) {
                                                      moveReference(r.id, originalStage)
                                                      toast.error("Erro ao mover: " + err.message)
                                                    }
                                                  }
                                                }}
                                              >
                                                <div
                                                  className="w-2 h-2 rounded-full"
                                                  style={{ background: STAGE_COLORS[s].border }}
                                                />
                                                {STAGE_LABELS[s]}
                                              </DropdownMenuItem>
                                            ))}
                                          </DropdownMenuSubContent>
                                        </DropdownMenuSub>

                                        {/* Quick exclude */}
                                        {r.stage !== "excluded" && (
                                          <DropdownMenuSub>
                                            <DropdownMenuSubTrigger className="gap-2 text-xs text-[#B94040] focus:text-[#B94040]">
                                              <X className="w-3.5 h-3.5" />
                                              Excluir rapidamente
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent className="rounded-xl border-[#E5E2DA] w-52">
                                              {[
                                                { cat: "Duplicado", reason: "Identificado como duplicado na triagem rápida." },
                                                { cat: "Tese/Dissertação", reason: "Trabalho académico (tese/dissertação) fora do escopo." },
                                                { cat: "Capítulo de Livro", reason: "Capítulo de livro fora do escopo." },
                                                { cat: "Livro", reason: "Livro (monografia) fora do escopo." },
                                                { cat: "Artigo Retratado", reason: "Artigo formalmente retratado pelos autores ou editor." },
                                                { cat: "Remoção por Título", reason: "Título não relacionado com o tema." },
                                              ].map(({ cat, reason }) => (
                                                <DropdownMenuItem
                                                  key={cat}
                                                  className="text-xs"
                                                  onClick={() =>
                                                    confirmExclusion(cat as ExclusionCategory, reason)
                                                  }
                                                >
                                                  {cat}
                                                </DropdownMenuItem>
                                              ))}
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                className="text-xs font-semibold"
                                                onClick={() => setExclusion({ refId: r.id })}
                                              >
                                                Outro motivo...
                                              </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                          </DropdownMenuSub>
                                        )}

                                        <DropdownMenuSeparator />

                                        {/* Delete */}
                                        <DropdownMenuItem
                                          className="gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/5"
                                          onClick={() => setDeleteConfirm(r)}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          Eliminar permanentemente
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>

                                {/* Card content (clickable to open detail) */}
                                <button
                                  className="text-left w-full group/btn"
                                  onClick={() => setDetailRef(r)}
                                >
                                  <h4 className="font-serif text-[15px] leading-snug text-[#2D2D2D] mb-2 group-hover/btn:text-primary transition-colors line-clamp-3">
                                    {r.title}
                                  </h4>
                                  <div className="flex items-center gap-2 text-[11px] text-[#71717A] mb-1">
                                    <span className="font-medium text-[#444444]">
                                      {formatAuthors(r.authors)}
                                    </span>
                                    {r.year && (
                                      <>
                                        <span className="w-1 h-1 rounded-full bg-[#E5E2DA]" />
                                        <span>{r.year}</span>
                                      </>
                                    )}
                                  </div>
                                  {r.journal && (
                                    <div className="text-[10px] italic text-[#A1A1AA] line-clamp-1">
                                      {r.journal}
                                    </div>
                                  )}
                                </button>

                                {/* Footer */}
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#FAF9F6]">
                                  {r.type && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] py-0 px-1.5 h-5 bg-[#FAF9F6] border-[#E5E2DA] text-[#71717A] font-normal"
                                    >
                                      {r.type}
                                    </Badge>
                                  )}

                                  {r.stage === "excluded" && r.exclusionCategory && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-[#FFF1F1] rounded-md border border-[#FEE2E2]">
                                      <div className="w-1 h-3 rounded-full bg-[#EF4444]" />
                                      <span className="text-[9px] font-bold text-[#991B1B] uppercase tracking-tight">
                                        {r.exclusionCategory}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}

                        {provided.placeholder}

                        {/* Load more */}
                        {remaining > 0 && (
                          <button
                            onClick={() => loadMore(stage)}
                            className="w-full mt-2 py-2.5 px-4 rounded-xl border border-dashed border-[#C8C2BB] text-[11px] font-bold text-[#A1A1AA] hover:bg-white hover:text-[#5F5E60] hover:border-[#A1A1AA] transition-all flex items-center justify-center gap-2"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                            Carregar mais ({remaining} restantes)
                          </button>
                        )}

                        {/* Pagination info */}
                        {list.length > PAGE_SIZE && (
                          <div className="text-center text-[10px] text-[#A1A1AA] pt-1">
                            A mostrar {Math.min(visible.length, list.length)} de {list.length}
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </div>

      <AddReferenceModal open={openAdd} onOpenChange={setOpenAdd} />
      <ReferenceDetailModal
        reference={detailRef}
        open={!!detailRef}
        onOpenChange={(o) => !o && setDetailRef(null)}
      />
      <ExclusionModal
        open={!!exclusion}
        onOpenChange={(o) => {
          if (!o) setExclusion(null)
        }}
        onConfirm={confirmExclusion}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar referência?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              <span className="font-semibold text-[#1C1C1E]">{deleteConfirm?.title}</span>
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteConfirm) {
                  const toastId = toast.loading("A eliminar...")
                  try {
                    await deleteReferenceAction(slug, deleteConfirm.id)
                    deleteReference(deleteConfirm.id)
                    toast.success("Referência eliminada.", { id: toastId })
                  } catch (err: any) {
                    toast.error("Erro ao eliminar: " + err.message, { id: toastId })
                  }
                }
                setDeleteConfirm(null)
              }}
              className="bg-[#b94040] hover:bg-[#a23434] text-white rounded-xl"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function formatAuthors(authors: string[]): string {
  if (authors.length === 0) return "—"
  if (authors.length === 1) return authors[0]
  if (authors.length === 2) return `${authors[0]}, ${authors[1]}`
  return `${authors[0]} et al.`
}

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5 mt-1.5" aria-label="Pontuação de qualidade">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={(e) => {
            e.stopPropagation()
            onChange(value === n ? 0 : n)
          }}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "w-3 h-3 transition-colors",
              n <= value ? "fill-[#c4914a] text-[#c4914a]" : "text-[#c8c2bb]",
            )}
          />
        </button>
      ))}
    </div>
  )
}
