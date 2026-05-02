"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "../page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Plus,
  Search,
  Trash2,
  Edit3,
  Star,
  Upload,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  X,
  Library,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Globe
} from "lucide-react"
import type { Reference, Stage, ExclusionCategory } from "@/lib/types"
import { STAGE_COLORS, STAGE_LABELS } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { deleteReferenceAction, updateReferenceAction, moveReferenceAction } from "@/lib/actions/reference"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 12

type SortKey = "title" | "year" | "stage" | "qualityScore" | "database"
type SortDir = "asc" | "desc"

export function ReferencesView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { state, deleteReference, updateReference, moveReference } = useStore()
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  // Modals
  const [openAdd, setOpenAdd] = useState(false)
  const [detailRef, setDetailRef] = useState<Reference | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Reference | null>(null)
  const [exclusion, setExclusion] = useState<{ refId: string } | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState<string>("__all")
  const [yearFilter, setYearFilter] = useState<string>("__all")
  const [dbFilter, setDbFilter] = useState<string>("__all")
  const [qualityFilter, setQualityFilter] = useState<string>("__all")

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("title")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  // Pagination
  const [page, setPage] = useState(1)

  // Derived data
  const allDatabases = useMemo(() => {
    const set = new Set<string>()
    state.references.forEach((r) => r.database && set.add(r.database))
    return Array.from(set).sort()
  }, [state.references])

  const allYears = useMemo(() => {
    const set = new Set<number>()
    state.references.forEach((r) => r.year && set.add(r.year))
    return Array.from(set).sort((a, b) => b - a)
  }, [state.references])

  const filtered = useMemo(() => {
    return state.references.filter((r) => {
      if (search) {
        const q = search.toLowerCase()
        const hay =
          r.title + " " + r.authors.join(" ") + " " + (r.abstractNote || "") + " " + (r.journal || "")
        if (!hay.toLowerCase().includes(q)) return false
      }
      if (stageFilter !== "__all" && r.stage !== stageFilter) return false
      if (yearFilter !== "__all" && String(r.year) !== yearFilter) return false
      if (dbFilter !== "__all" && r.database !== dbFilter) return false
      if (qualityFilter !== "__all") {
        const minScore = parseInt(qualityFilter, 10)
        if ((r.qualityScore || 0) < minScore) return false
      }
      return true
    })
  }, [state.references, search, stageFilter, yearFilter, dbFilter, qualityFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number = ""
      let bv: string | number = ""
      if (sortKey === "title") { av = a.title.toLowerCase(); bv = b.title.toLowerCase() }
      else if (sortKey === "year") { av = a.year || 0; bv = b.year || 0 }
      else if (sortKey === "stage") { av = a.stage; bv = b.stage }
      else if (sortKey === "qualityScore") { av = a.qualityScore || 0; bv = b.qualityScore || 0 }
      else if (sortKey === "database") { av = a.database || ""; bv = b.database || "" }
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
    setPage(1)
  }

  const clearFilters = () => {
    setSearch("")
    setStageFilter("__all")
    setYearFilter("__all")
    setDbFilter("__all")
    setQualityFilter("__all")
    setPage(1)
  }

  const hasActiveFilters =
    search || stageFilter !== "__all" || yearFilter !== "__all" || dbFilter !== "__all" || qualityFilter !== "__all"

  const confirmExclusion = async (cat: ExclusionCategory, reason: string) => {
    if (!exclusion) return
    const toastId = toast.loading("A excluir referência...")
    try {
      await moveReferenceAction(slug, exclusion.refId, "excluded", { exclusionCategory: cat, exclusionReason: reason })
      moveReference(exclusion.refId, "excluded", { exclusionCategory: cat, exclusionReason: reason })
      toast.success("Referência excluída com sucesso.", { id: toastId })
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message, { id: toastId })
    }
    setExclusion(null)
  }

  const SortIcon = ({ k }: { k: SortKey }) => (
    <ArrowUpDown
      className={cn(
        "w-3 h-3 ml-1 inline transition-opacity",
        sortKey === k ? "opacity-100 text-[#5c7e6b]" : "opacity-30"
      )}
    />
  )

  return (
    <div className="flex flex-col min-h-full bg-[#FAF8F4]">
      <PageHeader
        title="Biblioteca Bibliográfica"
        subtitle={
          <span className="flex items-center gap-2">
            <Library className="w-4 h-4 text-[#5c7e6b]" />
            Listagem completa de artigos ({filtered.length} de {state.references.length})
          </span>
        }
        actions={
          <div className="flex gap-2 lg:gap-3">
            <Button variant="outline" onClick={() => onNavigate("import")} className="hidden sm:flex gap-2 border-[#E5E2DA] hover:bg-white transition-all text-[#1C1C1E]">
              <Upload className="w-4 h-4" /> Importar
            </Button>
            <Button
              onClick={() => setOpenAdd(true)}
              className="gap-2 bg-[#1C1C1E] hover:bg-black text-white shadow-md shadow-black/10 px-6"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </Button>
          </div>
        }
      />

      {/* Filter & Toolbar Area */}
      <div className="px-4 lg:px-8 py-4 bg-white border-b border-[#E5E2DA] shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          
          {/* Search */}
          <div className="relative w-full xl:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Pesquisar título, autores ou DOI..."
              className="pl-10 border-[#E5E2DA] focus-visible:ring-[#6B8F71] rounded-lg bg-[#FAF8F4]/50 h-10"
            />
          </div>

          {/* Filters Grid */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#FAF8F4] p-1 rounded-lg border border-[#E5E2DA]">
              <FilterSelect 
                value={stageFilter} 
                onValueChange={(v) => { setStageFilter(v); setPage(1) }} 
                placeholder="Fase"
                options={[
                  { value: "__all", label: "Todas as Fases" },
                  { value: "identification", label: "Identificação" },
                  { value: "screening", label: "Triagem" },
                  { value: "eligibility", label: "Elegibilidade" },
                  { value: "included", label: "Incluídos" },
                  { value: "excluded", label: "Excluídos" },
                ]}
              />
              <FilterSelect 
                value={dbFilter} 
                onValueChange={(v) => { setDbFilter(v); setPage(1) }} 
                placeholder="Fonte"
                options={[
                  { value: "__all", label: "Todas as Fontes" },
                  ...allDatabases.map(db => ({ value: db, label: db }))
                ]}
              />
              <FilterSelect 
                value={yearFilter} 
                onValueChange={(v) => { setYearFilter(v); setPage(1) }} 
                placeholder="Ano"
                options={[
                  { value: "__all", label: "Todos os Anos" },
                  ...allYears.map(y => ({ value: String(y), label: String(y) }))
                ]}
              />
            </div>

            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters} 
                className="text-xs font-bold text-[#A1A1AA] hover:text-[#ba1a1a] gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* References Content */}
      <div className="flex-1 p-4 lg:p-8">
        <div className="bg-white border border-[#E5E2DA] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#E5E2DA] scrollbar-track-transparent">
            <table className="min-w-[4000px] text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F4] border-b border-[#E5E2DA]">
                  <th className="p-4 w-12 text-center sticky left-0 bg-[#FAF8F4] z-20">
                    <input
                      type="checkbox"
                      className="rounded border-[#E5E2DA] text-[#6B8F71] focus:ring-[#6B8F71] w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th
                    className="p-4 w-[450px] font-serif text-[11px] font-bold uppercase tracking-wider text-[#5F5E60] cursor-pointer hover:text-[#1C1C1E] transition-colors group sticky left-12 bg-[#FAF8F4] z-20 border-r border-[#E5E2DA]"
                    onClick={() => handleSort("title")}
                  >
                    Título & Autores <SortIcon k="title" />
                  </th>
                  {[
                    "year", "itemType", "journal", "doi", "url", "isbn", "issn", "pages", "numPages", "issue", "volume", 
                    "publisher", "place", "language", "journalAbbreviation", "shortTitle", "series", "seriesNumber", 
                    "seriesTitle", "archive", "archiveLocation", "libraryCatalog", "callNumber", "rights", "extra", 
                    "manualTags", "automaticTags", "editor", "seriesEditor", "translator", "contributor", 
                    "attorneyAgent", "bookAuthor", "castMember", "commenter", "composer", "cosponsor", "counsel", 
                    "interviewer", "producer", "recipient", "reviewedAuthor", "scriptwriter", "wordsBy", "guest", 
                    "number", "edition", "runningTime", "scale", "medium", "artworkSize", "filingDate", 
                    "applicationNumber", "assignee", "issuingAuthority", "country", "meetingName", "conferenceName", 
                    "court", "bibReferences", "reporter", "legalStatus", "priorityNumbers", "programmingLanguage", 
                    "version", "system", "code", "codeNumber", "section", "session", "committee", "history", "legislativeBody",
                    "abstractNote", "notes"
                  ].map(key => (
                    <th key={key} className="p-4 font-serif text-[11px] font-bold uppercase tracking-wider text-[#5F5E60] whitespace-nowrap">
                      {key === "abstractNote" ? "abstract note" : key}
                    </th>
                  ))}
                  <th
                    className="p-4 w-[15%] font-serif text-[11px] font-bold uppercase tracking-wider text-[#5F5E60] cursor-pointer hover:text-[#1C1C1E] transition-colors"
                    onClick={() => handleSort("stage")}
                  >
                    Estado PRISMA <SortIcon k="stage" />
                  </th>
                  <th
                    className="p-4 w-[15%] font-serif text-[11px] font-bold uppercase tracking-wider text-[#5F5E60] cursor-pointer hover:text-[#1C1C1E] transition-colors"
                    onClick={() => handleSort("database")}
                  >
                    Fonte de Dados <SortIcon k="database" />
                  </th>
                  <th
                    className="p-4 w-[10%] font-serif text-[11px] font-bold uppercase tracking-wider text-[#5F5E60] cursor-pointer hover:text-[#1C1C1E] transition-colors text-center"
                    onClick={() => handleSort("qualityScore")}
                  >
                    Qualidade <SortIcon k="qualityScore" />
                  </th>
                  <th className="p-4 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DA]">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-[#FAF8F4] rounded-full flex items-center justify-center text-[#E5E2DA]">
                          <Library className="w-8 h-8" />
                        </div>
                        <p className="text-[#A1A1AA] font-medium italic">
                          {hasActiveFilters ? "Sem resultados para os filtros selecionados." : "Nenhum artigo encontrado na biblioteca."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((ref, idx) => (
                    <ReferenceRow
                      key={ref.id}
                      reference={ref}
                      onEdit={() => setDetailRef(ref)}
                      onDetail={() => router.push(`/projects/${slug}/references/${ref.id}`)}
                      onDelete={() => setDeleteConfirm(ref)}
                      onUpdateQuality={async (score) => {
                        const originalScore = ref.qualityScore
                        updateReference(ref.id, { qualityScore: score }) // Optimistic UI
                        try {
                          await updateReferenceAction(slug, ref.id, { qualityScore: score })
                        } catch (err: any) {
                          updateReference(ref.id, { qualityScore: originalScore }) // Rollback
                          toast.error("Erro ao atualizar qualidade")
                        }
                      }}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="px-6 py-4 bg-[#FAF8F4] border-t border-[#E5E2DA] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[11px] font-mono font-bold text-[#A1A1AA] uppercase tracking-widest">
              Mostrando <span className="text-[#1C1C1E]">{paginated.length}</span> de <span className="text-[#1C1C1E]">{sorted.length}</span> artigos
            </div>
            
            <div className="flex items-center gap-1">
              <PaginationButton 
                onClick={() => setPage(p => p - 1)} 
                disabled={page === 1}
                icon={<ChevronLeft className="w-4 h-4" />}
              />
              
              <div className="flex gap-1 px-2">
                {getPaginationRange(page, totalPages).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => typeof p === "number" && setPage(p)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                      page === p 
                        ? "bg-[#1C1C1E] text-white shadow-lg shadow-black/10" 
                        : "text-[#5F5E60] hover:bg-[#E5E2DA]/50"
                    )}
                    disabled={typeof p !== "number"}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <PaginationButton 
                onClick={() => setPage(p => p + 1)} 
                disabled={page === totalPages}
                icon={<ChevronRight className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddReferenceModal open={openAdd} onOpenChange={setOpenAdd} />
      <ReferenceDetailModal
        reference={detailRef}
        open={!!detailRef}
        onOpenChange={(o) => !o && setDetailRef(null)}
      />
      <ExclusionModal
        open={!!exclusion}
        onOpenChange={(o) => { if (!o) setExclusion(null) }}
        onConfirm={confirmExclusion}
      />
      
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-xl border-[#E5E2DA]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl font-bold">Eliminar Referência?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#5C5955] leading-relaxed">
              Esta ação é permanente e removerá <strong>"{deleteConfirm?.title}"</strong> de todos os fluxos de trabalho do projeto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg border-[#E5E2DA]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteConfirm) {
                  const toastId = toast.loading("A remover artigo...")
                  try {
                    await deleteReferenceAction(slug, deleteConfirm.id)
                    deleteReference(deleteConfirm.id)
                    toast.success("Artigo removido permanentemente.", { id: toastId })
                  } catch (err: any) {
                    toast.error("Erro ao remover artigo: " + err.message, { id: toastId })
                  }
                }
                setDeleteConfirm(null)
              }}
              className="bg-[#ba1a1a] hover:bg-[#a01616] text-white rounded-lg px-6"
            >
              Confirmar Eliminação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function FilterSelect({ value, onValueChange, placeholder, options }: { value: string, onValueChange: (v: string) => void, placeholder: string, options: { value: string, label: string }[] }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-auto min-w-[120px] h-8 border-none bg-transparent hover:bg-white transition-colors text-xs font-bold font-serif focus:ring-0">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-[#E5E2DA] shadow-xl">
        {options.map(opt => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function PaginationButton({ onClick, disabled, icon }: { onClick: () => void, disabled: boolean, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-2 border border-[#E5E2DA] rounded-lg text-[#1C1C1E] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
    >
      {icon}
    </button>
  )
}

function ReferenceRow({
  reference,
  onEdit,
  onDetail,
  onDelete,
  onUpdateQuality,
}: {
  reference: Reference
  onEdit: () => void
  onDetail: () => void
  onDelete: () => void
  onUpdateQuality: (score: number) => void
}) {
  const sc = STAGE_COLORS[reference.stage]

  return (
    <tr className="group hover:bg-[#FAF8F4]/50 transition-all border-b border-[#E5E2DA]">
      <td className="p-4 text-center sticky left-0 bg-white group-hover:bg-[#FAF8F4]/50 z-10">
        <input
          type="checkbox"
          className="rounded border-[#E5E2DA] text-[#6B8F71] focus:ring-[#6B8F71] w-4 h-4 cursor-pointer"
        />
      </td>

      {/* Main Info */}
      <td className="p-4 sticky left-12 bg-white group-hover:bg-[#FAF8F4]/50 z-10 border-r border-[#E5E2DA] w-[450px]">
        <div className="flex flex-col min-w-0">
          <button
            onClick={onEdit}
            className="text-left font-serif text-sm font-semibold text-[#1C1C1E] leading-snug hover:text-[#6B8F71] transition-colors line-clamp-2"
          >
            {reference.title}
          </button>
          <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
            <span className="text-[11px] font-medium text-[#5F5E60] truncate max-w-[380px]">
              {formatAuthors(reference.authors)}
            </span>
          </div>
        </div>
      </td>

      {/* Dynamic Columns */}
      {[
        "year", "itemType", "journal", "doi", "url", "isbn", "issn", "pages", "numPages", "issue", "volume", 
        "publisher", "place", "language", "journalAbbreviation", "shortTitle", "series", "seriesNumber", 
        "seriesTitle", "archive", "archiveLocation", "libraryCatalog", "callNumber", "rights", "extra", 
        "manualTags", "automaticTags", "editor", "seriesEditor", "translator", "contributor", 
        "attorneyAgent", "bookAuthor", "castMember", "commenter", "composer", "cosponsor", "counsel", 
        "interviewer", "producer", "recipient", "reviewedAuthor", "scriptwriter", "wordsBy", "guest", 
        "number", "edition", "runningTime", "scale", "medium", "artworkSize", "filingDate", 
        "applicationNumber", "assignee", "issuingAuthority", "country", "meetingName", "conferenceName", 
        "court", "bibReferences", "reporter", "legalStatus", "priorityNumbers", "programmingLanguage", 
        "version", "system", "code", "codeNumber", "section", "session", "committee", "history", "legislativeBody",
        "abstractNote", "notes"
      ].map(key => (
        <td key={key} className="p-4 text-xs text-[#5F5E60] truncate max-w-[150px]">
          {(reference as any)[key] || "—"}
        </td>
      ))}

      {/* Stage Badge */}
      <td className="p-4">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            style={{ background: sc.bg, color: sc.text }}
          >
            {STAGE_LABELS[reference.stage]}
          </span>
          {reference.stage === "included" && <CheckCircle2 className="w-3 h-3 text-[#6B8F71]" />}
          {reference.stage === "excluded" && <AlertCircle className="w-3 h-3 text-[#ba1a1a]" />}
        </div>
      </td>

      {/* Source */}
      <td className="p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1C1E]/80">
          <Globe className="w-3 h-3 text-[#A1A1AA]" />
          {reference.database || "Desconhecida"}
        </div>
      </td>

      {/* Quality Stars */}
      <td className="p-4">
        <div className="flex items-center justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onUpdateQuality((reference.qualityScore || 0) === n ? 0 : n)}
              className="hover:scale-125 transition-transform"
            >
              <Star
                className={cn(
                  "w-3.5 h-3.5",
                  n <= (reference.qualityScore || 0)
                    ? "fill-[#c4914a] text-[#c4914a]"
                    : "text-[#E5E2DA]"
                )}
              />
            </button>
          ))}
        </div>
      </td>

      {/* Actions Dropdown */}
      <td className="p-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 text-[#A1A1AA] hover:text-[#1C1C1E] rounded-full">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl border-[#E5E2DA] shadow-xl w-48 p-1">
            <DropdownMenuItem onClick={onEdit} className="gap-2 text-xs font-medium rounded-lg">
              <Edit3 className="w-3.5 h-3.5" /> Editar Informação
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDetail} className="gap-2 text-xs font-medium rounded-lg">
              <ExternalLink className="w-3.5 h-3.5" /> Ver Ficha Completa
            </DropdownMenuItem>
            <div className="h-px bg-[#E5E2DA] my-1" />
            <DropdownMenuItem onClick={onDelete} className="gap-2 text-xs font-medium text-[#ba1a1a] hover:bg-red-50 rounded-lg">
              <Trash2 className="w-3.5 h-3.5" /> Eliminar Permanente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function formatAuthors(authors: string[]): string {
  if (!authors || authors.length === 0) return "Sem Autores"
  if (authors.length === 1) return authors[0]
  if (authors.length === 2) return `${authors[0]} & ${authors[1]}`
  return `${authors[0]} et al.`
}

function getPaginationRange(current: number, total: number): (number | "...")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "...")[] = []
  pages.push(1)
  if (current > 3) pages.push("...")
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p)
  }
  if (current < total - 2) pages.push("...")
  pages.push(total)
  return pages
}
