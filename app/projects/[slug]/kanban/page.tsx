"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useStore } from "@/lib/store"
import { AddReferenceModal, ReferenceDetailModal } from "@/components/litmap/reference-modal"
import { ExclusionModal } from "@/components/litmap/exclusion-modal"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd"
import type { ExclusionCategory, Reference, Stage } from "@/lib/types"
import { STAGE_COLORS, STAGE_LABELS, STAGES } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  Plus,
  Search,
  X,
  Star,
  MoreHorizontal,
  Eye,
  ExternalLink,
  Trash2,
  ArrowRightLeft,
  ChevronDown,
  Filter,
  Layers,
} from "lucide-react"
import {
  moveReferenceAction,
  deleteReferenceAction,
  updateReferenceAction,
} from "@/lib/actions/reference"

const PAGE_SIZE = 25

export default function KanbanPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const { state, moveReference, deleteReference, updateReference } = useStore()

  const [openAdd, setOpenAdd] = useState(false)
  const [detailRef, setDetailRef] = useState<Reference | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Reference | null>(null)
  const [exclusion, setExclusion] = useState<{ refId: string } | null>(null)

  const [search, setSearch] = useState("")
  const [dbFilter, setDbFilter] = useState("__all")
  const [yearFilter, setYearFilter] = useState("__all")
  const [pages, setPages] = useState<Record<Stage, number>>({
    identification: 1, screening: 1, eligibility: 1, included: 1, excluded: 1,
  })

  useEffect(() => {
    setPages({ identification: 1, screening: 1, eligibility: 1, included: 1, excluded: 1 })
  }, [search, dbFilter, yearFilter])

  const allDatabases = useMemo(() => {
    const s = new Set<string>()
    state.references.forEach(r => r.database && s.add(r.database))
    return Array.from(s).sort()
  }, [state.references])

  const allYears = useMemo(() => {
    const s = new Set<number>()
    state.references.forEach(r => r.year && s.add(r.year))
    return Array.from(s).sort((a, b) => b - a)
  }, [state.references])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return state.references.filter(r => {
      if (q) {
        const hay = `${r.title} ${r.authors.join(" ")} ${r.abstractNote || ""} ${r.journal || ""}`
        if (!hay.toLowerCase().includes(q)) return false
      }
      if (dbFilter !== "__all" && r.database !== dbFilter) return false
      if (yearFilter !== "__all" && String(r.year) !== yearFilter) return false
      return true
    })
  }, [state.references, search, dbFilter, yearFilter])

  const byStage = useMemo(() => {
    const g: Record<Stage, Reference[]> = {
      identification: [], screening: [], eligibility: [], included: [], excluded: [],
    }
    filtered.forEach(r => g[r.stage].push(r))
    return g
  }, [filtered])

  const hasFilters = search || dbFilter !== "__all" || yearFilter !== "__all"

  const clearFilters = () => { setSearch(""); setDbFilter("__all"); setYearFilter("__all") }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const refId = result.draggableId
    const target = result.destination.droppableId as Stage
    const ref = state.references.find(r => r.id === refId)
    if (!ref || ref.stage === target) return
    if (target === "excluded") { setExclusion({ refId }); return }
    const original = ref.stage
    moveReference(refId, target)
    try {
      await moveReferenceAction(slug, refId, target)
      toast.success(`Movido para ${STAGE_LABELS[target]}.`)
    } catch (err: any) {
      moveReference(refId, original)
      toast.error("Erro ao mover: " + err.message)
    }
  }

  const confirmExclusion = async (cat: ExclusionCategory, reason: string) => {
    if (!exclusion) return
    const original = state.references.find(r => r.id === exclusion.refId)?.stage
    moveReference(exclusion.refId, "excluded", { exclusionCategory: cat, exclusionReason: reason })
    try {
      await moveReferenceAction(slug, exclusion.refId, "excluded", { exclusionCategory: cat, exclusionReason: reason })
      toast.success("Referência excluída.")
    } catch (err: any) {
      if (original) moveReference(exclusion.refId, original)
      toast.error("Erro: " + err.message)
    }
    setExclusion(null)
  }

  const handleMove = async (ref: Reference, target: Stage) => {
    if (target === "excluded") { setExclusion({ refId: ref.id }); return }
    const original = ref.stage
    moveReference(ref.id, target)
    try {
      await moveReferenceAction(slug, ref.id, target)
      toast.success(`Movido para ${STAGE_LABELS[target]}.`)
    } catch (err: any) {
      moveReference(ref.id, original)
      toast.error("Erro: " + err.message)
    }
  }

  const handleDelete = async (ref: Reference) => {
    const toastId = toast.loading("A eliminar...")
    try {
      await deleteReferenceAction(slug, ref.id)
      deleteReference(ref.id)
      toast.success("Eliminado.", { id: toastId })
    } catch (err: any) {
      toast.error("Erro: " + err.message, { id: toastId })
    }
    setDeleteConfirm(null)
  }

  const handleQuality = async (ref: Reference, v: number) => {
    const original = ref.qualityScore
    updateReference(ref.id, { qualityScore: v })
    try {
      await updateReferenceAction(slug, ref.id, { qualityScore: v })
    } catch {
      updateReference(ref.id, { qualityScore: original })
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F2ED]">

      {/* ── Single unified sticky header ── */}
      <div className="sticky top-0 z-30 bg-[#FAF8F4]/95 backdrop-blur-md border-b border-[#E5E2DA] shadow-sm">
        {/* Title row */}
        <div className="px-6 lg:px-8 pt-5 pb-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-xl lg:text-2xl font-bold text-[#1C1C1E] leading-tight">
              Quadro de Triagem
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-0.5 hidden sm:block">
              {state.references.length} referências · arraste para mover entre fases PRISMA
            </p>
          </div>
          <Button
            onClick={() => setOpenAdd(true)}
            className="bg-[#1C1C1E] hover:bg-black text-white h-9 rounded-xl gap-2 font-semibold text-xs px-5 shadow-md shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Artigo
          </Button>
        </div>

        {/* Filter row */}
        <div className="px-6 lg:px-8 pb-4 flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A1A1AA]" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              className="pl-9 h-8 text-xs bg-white border-[#E5E2DA] rounded-xl focus-visible:ring-[#6B8F71]"
            />
          </div>

          {/* DB filter */}
          <Select value={dbFilter} onValueChange={setDbFilter}>
            <SelectTrigger className="h-8 w-40 text-xs bg-white border-[#E5E2DA] rounded-xl font-semibold focus:ring-[#6B8F71]">
              <Filter className="w-3 h-3 mr-1 text-[#A1A1AA]" />
              <SelectValue placeholder="Base" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="__all" className="text-xs">Todas as bases</SelectItem>
              {allDatabases.map(db => (
                <SelectItem key={db} value={db} className="text-xs">{db}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year filter */}
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="h-8 w-32 text-xs bg-white border-[#E5E2DA] rounded-xl font-semibold focus:ring-[#6B8F71]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="__all" className="text-xs">Todos os anos</SelectItem>
              {allYears.map(y => (
                <SelectItem key={y} value={String(y)} className="text-xs font-mono">{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-[#A1A1AA] hover:text-[#ba1a1a] gap-1 px-2 rounded-lg"
            >
              <X className="w-3 h-3" /> Limpar
            </Button>
          )}

          {/* Stage summary chips */}
          <div className="ml-auto hidden lg:flex items-center gap-2">
            {STAGES.map(s => {
              const sc = STAGE_COLORS[s]
              return (
                <div
                  key={s}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ background: sc.bg, color: sc.text }}
                >
                  {STAGE_LABELS[s]}
                  <span className="font-mono">{byStage[s].length}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Board scroll area ── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-5 p-6 lg:p-8 h-full min-w-max items-start">
            {STAGES.map(stage => {
              const list = byStage[stage]
              const sc = STAGE_COLORS[stage]
              const visible = list.slice(0, pages[stage] * PAGE_SIZE)
              const remaining = list.length - visible.length

              return (
                <div key={stage} className="w-[300px] shrink-0 flex flex-col">
                  {/* Column header */}
                  <div className="mb-3 px-3 py-2.5 bg-white rounded-xl border border-[#E5E2DA] shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: sc.border }} />
                      <h3 className="font-serif font-bold text-sm text-[#1C1C1E]">{STAGE_LABELS[stage]}</h3>
                    </div>
                    <Badge
                      className="text-[11px] font-mono font-semibold rounded-lg border-0 px-2"
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
                          "flex flex-col gap-2.5 p-2 rounded-2xl min-h-[500px] transition-all duration-200",
                          snapshot.isDraggingOver
                            ? "bg-white/60 ring-2 ring-inset ring-[#E5E2DA]"
                            : "bg-transparent"
                        )}
                      >
                        {list.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#E5E2DA]/60 rounded-xl text-center">
                            <Layers className="w-6 h-6 text-[#C8C2BB] mb-1.5" />
                            <p className="text-[10px] text-[#C8C2BB] font-bold uppercase tracking-wider">Vazio</p>
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
                                  "group bg-white rounded-xl border border-transparent border-l-[4px] p-3.5 cursor-grab active:cursor-grabbing transition-all duration-150",
                                  snap.isDragging
                                    ? "shadow-2xl scale-[1.02] rotate-[0.5deg]"
                                    : "shadow-sm hover:shadow-md hover:border-r-[#E5E2DA] hover:border-t-[#E5E2DA] hover:border-b-[#E5E2DA]",
                                  r.stage === "excluded" && "opacity-75"
                                )}
                                style={{ borderLeftColor: sc.border }}
                              >
                                {/* Top row */}
                                <div className="flex items-start justify-between gap-1.5 mb-2">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {r.database && (
                                      <span className="text-[9px] uppercase tracking-widest font-bold text-[#A1A1AA] bg-[#FAF9F6] px-1.5 py-0.5 rounded border border-[#E5E2DA]">
                                        {r.database}
                                      </span>
                                    )}
                                    {r.year && (
                                      <span className="text-[9px] font-bold font-mono text-[#A1A1AA]">
                                        {r.year}
                                      </span>
                                    )}
                                  </div>

                                  {/* 3-dot menu */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-6 h-6 rounded-md text-[#C8C2BB] hover:text-[#1C1C1E] hover:bg-[#F5F2ED] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                        onClick={e => e.stopPropagation()}
                                      >
                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-52 rounded-xl shadow-xl border-[#E5E2DA]"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <DropdownMenuItem className="gap-2 text-xs" onClick={() => setDetailRef(r)}>
                                        <Eye className="w-3.5 h-3.5" /> Ver detalhes
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="gap-2 text-xs" onClick={() => router.push(`/projects/${slug}/references/${r.id}`)}>
                                        <ExternalLink className="w-3.5 h-3.5" /> Abrir página completa
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="gap-2 text-xs">
                                          <ArrowRightLeft className="w-3.5 h-3.5" /> Mover para...
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent className="rounded-xl border-[#E5E2DA]">
                                          {STAGES.filter(s => s !== r.stage).map(s => (
                                            <DropdownMenuItem
                                              key={s}
                                              className="gap-2 text-xs"
                                              onClick={() => handleMove(r, s)}
                                            >
                                              <div className="w-2 h-2 rounded-full" style={{ background: STAGE_COLORS[s].border }} />
                                              {STAGE_LABELS[s]}
                                            </DropdownMenuItem>
                                          ))}
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                      {r.stage !== "excluded" && (
                                        <DropdownMenuSub>
                                          <DropdownMenuSubTrigger className="gap-2 text-xs text-[#B94040] focus:text-[#B94040]">
                                            <X className="w-3.5 h-3.5" /> Excluir rapidamente
                                          </DropdownMenuSubTrigger>
                                          <DropdownMenuSubContent className="rounded-xl border-[#E5E2DA] w-52">
                                            {[
                                              ["Duplicado", "Identificado como duplicado."],
                                              ["Tese/Dissertação", "Trabalho académico fora do escopo."],
                                              ["Capítulo de Livro", "Capítulo de livro fora do escopo."],
                                              ["Livro", "Livro (monografia) fora do escopo."],
                                              ["Artigo Retratado", "Artigo formalmente retratado."],
                                              ["Remoção por Título", "Título não relacionado com o tema."],
                                            ].map(([cat, reason]) => (
                                              <DropdownMenuItem
                                                key={cat}
                                                className="text-xs"
                                                onClick={() => confirmExclusion(cat as ExclusionCategory, reason)}
                                              >
                                                {cat}
                                              </DropdownMenuItem>
                                            ))}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-xs font-semibold" onClick={() => setExclusion({ refId: r.id })}>
                                              Outro motivo...
                                            </DropdownMenuItem>
                                          </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/5"
                                        onClick={() => setDeleteConfirm(r)}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" /> Eliminar permanentemente
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {/* Title (clickable) */}
                                <button
                                  className="text-left w-full"
                                  onClick={() => setDetailRef(r)}
                                >
                                  <h4 className="font-serif text-[14px] font-bold leading-snug text-[#1C1C1E] line-clamp-3 mb-1.5 hover:text-[#6B8F71] transition-colors">
                                    {r.title}
                                  </h4>
                                  <p className="text-[11px] text-[#71717A] truncate">
                                    {r.authors.length === 0 ? "—" : r.authors.length === 1 ? r.authors[0] : `${r.authors[0]} et al.`}
                                  </p>
                                  {r.journal && (
                                    <p className="text-[10px] italic text-[#A1A1AA] truncate mt-0.5">{r.journal}</p>
                                  )}
                                </button>

                                {/* Footer */}
                                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#FAF9F6]">
                                  {/* Quality stars */}
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(n => (
                                      <button
                                        key={n}
                                        onClick={e => { e.stopPropagation(); handleQuality(r, r.qualityScore === n ? 0 : n) }}
                                      >
                                        <Star className={cn("w-3 h-3 transition-colors", n <= (r.qualityScore || 0) ? "fill-[#c4914a] text-[#c4914a]" : "text-[#E5E2DA]")} />
                                      </button>
                                    ))}
                                  </div>
                                  {r.type && (
                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-[#FAF9F6] border-[#E5E2DA] text-[#A1A1AA] font-normal">
                                      {r.type}
                                    </Badge>
                                  )}
                                </div>

                                {/* Exclusion tag */}
                                {r.stage === "excluded" && r.exclusionCategory && (
                                  <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-lg border border-red-100">
                                    <div className="w-1 h-3 rounded-full bg-red-400 shrink-0" />
                                    <span className="text-[9px] font-bold text-red-600 uppercase tracking-tight truncate">
                                      {r.exclusionCategory}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}

                        {provided.placeholder}

                        {/* Load more */}
                        {remaining > 0 && (
                          <button
                            onClick={() => setPages(prev => ({ ...prev, [stage]: prev[stage] + 1 }))}
                            className="w-full py-2 rounded-xl border border-dashed border-[#C8C2BB] text-[11px] font-bold text-[#A1A1AA] hover:bg-white hover:text-[#5F5E60] hover:border-[#A1A1AA] transition-all flex items-center justify-center gap-1.5 mt-1"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                            {remaining} restantes
                          </button>
                        )}
                        {list.length > PAGE_SIZE && (
                          <p className="text-center text-[10px] text-[#C8C2BB] mt-1">
                            {Math.min(visible.length, list.length)} / {list.length}
                          </p>
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

      {/* Modals */}
      <AddReferenceModal open={openAdd} onOpenChange={setOpenAdd} />
      <ReferenceDetailModal
        reference={detailRef}
        open={!!detailRef}
        onOpenChange={o => !o && setDetailRef(null)}
      />
      <ExclusionModal
        open={!!exclusion}
        onOpenChange={o => { if (!o) setExclusion(null) }}
        onConfirm={confirmExclusion}
      />
      <AlertDialog open={!!deleteConfirm} onOpenChange={o => !o && setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Eliminar referência?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              <span className="font-semibold text-[#1C1C1E]">{deleteConfirm?.title}</span>
              <br />Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-[#ba1a1a] hover:bg-[#a01616] text-white rounded-xl"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
