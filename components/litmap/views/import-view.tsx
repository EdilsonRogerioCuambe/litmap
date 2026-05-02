"use client"

import { useRouter, useParams } from "next/navigation"
import { useMemo, useRef, useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { PageHeader } from "../page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
  AlertTriangle,
  ChevronDown,
  CloudUpload,
  FileText,
  Trash2,
  X,
  Database,
  CheckCircle2,
  Clock,
  Info,
  ChevronRight,
  Plus
} from "lucide-react"
import { markDuplicates, parseFile, type ParsedReference } from "@/lib/parsers"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { importReferencesAction, deleteImportBatchAction } from "@/lib/actions/project"

type Row = ParsedReference & {
  __id: string
  __selected: boolean
  __filename: string
}

const FORMAT_GUIDE: { db: string; format: string; note?: string }[] = [
  { db: "Scopus", format: "RIS ou CSV" },
  { db: "Web of Science", format: "BibTeX, RIS ou Plain Text" },
  { db: "Google Scholar", format: "BibTeX (via Zotero)" },
  { db: "IEEE Xplore", format: "BibTeX, RIS ou CSV" },
  { db: "ACM Digital Library", format: "BibTeX" },
  { db: "PubMed", format: "NBIB ou XML" },
  { db: "Mendeley / Zotero", format: "BibTeX ou RIS" },
  { db: "ERIC", format: "RIS" },
]

export function ImportView() {
  const { state, addReferences, recordImport, importState } = useStore()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [filter, setFilter] = useState<"all" | "dup" | "new">("all")
  const [dragOver, setDragOver] = useState(false)
  const [parseErrors, setParseErrors] = useState(0)
  const [filenames, setFilenames] = useState<string[]>([])
  const [defaultDatabase, setDefaultDatabase] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [pendingDeleteBatch, setPendingDeleteBatch] = useState<string | null>(null)

  // True while the project is not yet loaded from DB
  const projectIsLoading = !state.project

  // Sync defaultDatabase when project loads
  useEffect(() => {
    if (state.project?.databases?.length && !defaultDatabase) {
      setDefaultDatabase(state.project.databases[0])
    }
  }, [state.project?.databases, defaultDatabase])

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files)
    let allParsed: Row[] = []
    let errors = 0
    const fnames: string[] = []

    toast.promise(
      (async () => {
        // Pre-calculate existing references once to save CPU
        const existingRefs = state.references.map((r) => ({ 
          title: r.title, 
          doi: r.doi 
        }))

        for (const f of arr) {
          try {
            const text = await f.text()
            const parsed = parseFile(f.name, text)
            if (parsed.length === 0) errors++
            fnames.push(f.name)
            
            // Map to internal Row format
            const rowsBatch: Row[] = parsed.map((p) => ({
              ...p,
              __id: Math.random().toString(36).slice(2),
              __selected: true,
              __filename: f.name,
              database: p.database || "",
              importedFrom: f.name,
            }))
            
            allParsed.push(...rowsBatch)
            
            // Allow UI to breathe if we have many files
            await new Promise(resolve => setTimeout(resolve, 0))
          } catch (err) {
            errors++
          }
        }

        setParseErrors(errors)
        setFilenames((prev) => [...prev, ...fnames])

        // Optimized duplicate marking
        const marked = markDuplicates(allParsed, existingRefs)
        
        // Final state update
        setRows((prev) => [...prev, ...marked as Row[]])
        
        return allParsed.length
      })(),
      {
        loading: "A processar ficheiros... (isso pode levar uns segundos para arquivos grandes)",
        success: (count) => `${count} referências detetadas com sucesso!`,
        error: "Erro ao processar ficheiros."
      }
    )
  }

  const PREVIEW_LIMIT = 100
  const [showAll, setShowAll] = useState(false)

  const filteredRows = useMemo(() => {
    let base = rows
    if (filter === "dup") base = rows.filter((r) => r.__duplicate)
    if (filter === "new") base = rows.filter((r) => !r.__duplicate)
    
    if (!showAll && base.length > PREVIEW_LIMIT) {
      return base.slice(0, PREVIEW_LIMIT)
    }
    return base
  }, [rows, filter, showAll])

  const selectedCount = rows.filter((r) => r.__selected).length
  const duplicateCount = rows.filter((r) => r.__duplicate).length

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.__id === id ? { ...r, ...patch } : r)))
  }

  const importSelected = async () => {
    const sel = rows.filter((r) => r.__selected)
    if (sel.length === 0) {
      toast.error("Nenhuma referência selecionada.")
      return
    }

    const toastId = toast.loading("A guardar referências no banco de dados...")

    const toImport = sel.map((r) => {
      const { __id, __selected, __filename, __duplicate, ...rest } = r
      const db = rest.database || defaultDatabase
      return {
        ...rest,
        database: db,
        keywords: rest.keywords || [],
        authors: rest.authors || [],
        type: rest.type || "Artigo",
        stage: "identification" as const,
        importedFrom: __filename
      }
    })

    if (toImport.some((r) => !r.database)) {
      toast.error("Algumas referências selecionadas não têm uma base de dados definida.", { id: toastId })
      return
    }

    try {
      const savedReferences = await importReferencesAction(slug, {
        references: toImport,
        filenames: filenames,
        duplicateCount: duplicateCount,
        parseErrors: parseErrors
      })

      // Update local store with the references returned from DB (they have real IDs)
      addReferences(savedReferences)

      recordImport({
        date: new Date().toISOString(),
        filename: filenames.join(", ") || "—",
        format: filenames.map((f) => f.split(".").pop()).filter(Boolean).join(", "),
        imported: savedReferences.length,
        duplicates: duplicateCount,
        errors: parseErrors,
      })

      toast.success(`${savedReferences.length} referências importadas com sucesso!`, { id: toastId })
      setRows([])
      setFilenames([])
      setParseErrors(0)
    } catch (error) {
      console.error(error)
      toast.error("Erro ao importar referências. Tente novamente.", { id: toastId })
    }
  }

  const handleDeleteBatch = async (batchId: string) => {
    setIsDeleting(batchId)
    const toastId = toast.loading("A remover lote de referências...")

    try {
      await deleteImportBatchAction(slug, batchId)
      
      if (importState) {
        importState({
          ...state,
          imports: state.imports.filter((b: any) => b.id !== batchId),
          references: state.references.filter(r => r.importBatchId !== batchId)
        })
      }

      toast.success("Importação revertida com sucesso!", { id: toastId })
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover lote.", { id: toastId })
    } finally {
      setIsDeleting(null)
      setPendingDeleteBatch(null)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-[#FAF8F4]">
      <PageHeader
        title="Importação de Dados"
        subtitle="Carregue ficheiros RIS, BibTeX ou CSV para alimentar a sua biblioteca bibliográfica."
      />

      <div className="p-4 lg:p-8 space-y-8">

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

          {/* Left Column: Upload & Config */}
          <div className="xl:col-span-4 space-y-6">

            {/* Upload Zone */}
            <div
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              className={cn(
                "group relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[300px]",
                dragOver
                  ? "border-[#6B8F71] bg-[#6B8F71]/5 shadow-inner"
                  : "border-[#E5E2DA] bg-white hover:border-[#6B8F71] hover:bg-[#FAF8F4]"
              )}
              onClick={() => fileRef.current?.click()}
            >
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all duration-300",
                dragOver ? "bg-[#6B8F71] text-white scale-110" : "bg-[#FAF8F4] text-[#A1A1AA] group-hover:text-[#6B8F71] group-hover:bg-[#6B8F71]/10"
              )}>
                <CloudUpload className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1C1C1E] mb-2">Carregar Ficheiros</h3>
              <p className="text-sm text-[#5C5955] max-w-[240px] leading-relaxed">
                Arraste os seus ficheiros ou <span className="text-[#6B8F71] font-bold underline">clique para explorar</span>
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                {["RIS", "BIB", "CSV", "NBIB"].map(ext => (
                  <span key={ext} className="px-2 py-0.5 bg-[#E5E2DA]/30 rounded font-mono text-[9px] font-bold text-[#5F5E60] uppercase">{ext}</span>
                ))}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".bib,.ris,.csv,.tsv,.nbib,.xml,.txt"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files)
                  if (fileRef.current) fileRef.current.value = ""
                }}
              />
            </div>

            {/* Config Card */}
            <div className="bg-white rounded-xl border border-[#E5E2DA] p-6 shadow-sm">
              <h4 className="font-serif text-sm font-bold text-[#1C1C1E] mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#6B8F71]" />
                Configuração de Importação
              </h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Fonte Predeterminada</Label>
                  
                  {projectIsLoading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-10 bg-[#E5E2DA]/50 rounded-lg" />
                      <div className="h-8 bg-[#E5E2DA]/30 rounded-lg" />
                    </div>
                  ) : (!state.project?.databases || state.project.databases.length === 0) ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold mb-1 text-[13px]">Nenhuma base de dados ativa</p>
                        <p className="opacity-90 mb-3 text-[11px] leading-relaxed">Para importar, precisa de definir quais as bases de dados que o seu projeto utiliza.</p>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/projects/${slug}/settings`)}
                          className="h-8 text-[11px] font-bold border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
                        >
                          Configurar Estratégia agora →
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Select value={defaultDatabase} onValueChange={setDefaultDatabase}>
                        <SelectTrigger className="w-full h-10 border-[#E5E2DA] bg-white shadow-sm font-medium">
                          <SelectValue placeholder="Selecione a fonte..." />
                        </SelectTrigger>
                        <SelectContent className="z-[100] rounded-xl border-[#E5E2DA]">
                          {state.project.databases.map(db => (
                            <SelectItem key={db} value={db} className="text-sm">{db}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-start gap-2 p-3 bg-[#FAF8F4] rounded-lg border border-[#E5E2DA]/50">
                        <Info className="w-3.5 h-3.5 text-[#6B8F71] mt-0.5 shrink-0" />
                        <p className="text-[10px] text-[#5C5955] leading-tight italic">
                          Esta base será atribuída automaticamente a todas as referências que não tenham uma fonte identificada no ficheiro.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Guide Collapsible */}
            <Collapsible>
              <CollapsibleTrigger className="group w-full bg-white border border-[#E5E2DA] rounded-xl px-5 py-4 flex items-center justify-between hover:bg-[#FAF8F4] transition-all">
                <span className="font-serif text-sm font-bold text-[#1C1C1E] flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#A1A1AA]" />
                  Guia de Formatos
                </span>
                <ChevronDown className="w-4 h-4 text-[#A1A1AA] group-data-[state=open]:rotate-180 transition-transform" />
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-white border-x border-b border-[#E5E2DA] rounded-b-xl -mt-2 pt-4 px-5 pb-5 animate-in slide-in-from-top-2">
                <ul className="space-y-2.5">
                  {FORMAT_GUIDE.map((g) => (
                    <li key={g.db} className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1C1C1E]">{g.db}</span>
                      <span className="text-[#5F5E60] font-mono text-[10px]">{g.format}</span>
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Right Column: Preview & History */}
          <div className="xl:col-span-8 space-y-8">

            {/* Preview Table (if rows exist) */}
            {rows.length > 0 ? (
              <div className="bg-white rounded-xl border border-[#E5E2DA] shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {rows.some(r => !r.database) && (
                  <div className="bg-[#ba1a1a]/5 border-b border-[#ba1a1a]/10 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#ba1a1a] text-xs font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      Algumas referências estão sem base de dados definida!
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRows(prev => prev.map(r => r.database ? r : { ...r, database: defaultDatabase }))}
                      className="h-7 text-[10px] font-bold border-[#ba1a1a]/20 text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white"
                    >
                      Aplicar "{defaultDatabase || "Base Padrão"}" a todas as vazias
                    </Button>
                  </div>
                )}
                <div className="p-6 border-b border-[#E5E2DA] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#1C1C1E]">Confirmar Referências</h2>
                    <p className="text-xs text-[#5F5E60] mt-1 flex items-center gap-1.5 font-mono">
                      {rows.length} detectadas
                      {duplicateCount > 0 && <span className="text-[#ba1a1a]">• {duplicateCount} duplicados</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCount > 0 && (
                      <div className="flex items-center gap-2 pr-2 border-r border-[#E5E2DA]">
                        <span className="text-[10px] font-bold text-[#A1A1AA] uppercase">Mudar selecionados para:</span>
                        <Select onValueChange={(v) => {
                          setRows(prev => prev.map(r => r.__selected ? { ...r, database: v } : r))
                          toast.success(`Base de dados atualizada para ${selectedCount} referências.`)
                        }}>
                          <SelectTrigger className="w-40 h-8 border-[#E5E2DA] rounded-lg text-xs font-bold">
                            <SelectValue placeholder="Escolher base..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {(state.project?.databases || []).map(db => (
                              <SelectItem key={db} value={db} className="text-xs">{db}</SelectItem>
                            ))}
                            {(!state.project?.databases || state.project.databases.length === 0) && (
                              <div className="p-2 text-[10px] text-[#A1A1AA] italic">Nenhuma base configurada nas definições.</div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                      <SelectTrigger className="w-36 h-9 border-[#E5E2DA] rounded-lg text-xs font-bold font-serif">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="new">Apenas Novas</SelectItem>
                        <SelectItem value="dup">Duplicados</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={importSelected}
                      className="bg-[#1C1C1E] hover:bg-black text-white px-6 h-9 rounded-lg font-serif font-bold text-xs gap-2"
                    >
                      Importar {selectedCount} <Plus className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setRows([])} className="text-[#A1A1AA] hover:text-[#ba1a1a]">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {rows.length > PREVIEW_LIMIT && !showAll && (
                  <div className="mx-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3 text-amber-800 text-xs">
                      <Info className="w-4 h-4" />
                      <span>
                        A mostrar apenas as primeiras <strong>{PREVIEW_LIMIT}</strong> referências de <strong>{rows.length}</strong> detetadas para garantir fluidez.
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowAll(true)}
                      className="h-8 text-[10px] font-bold uppercase tracking-widest border-amber-200 text-amber-800 hover:bg-amber-100"
                    >
                      Ver Todas (Pode causar lentidão)
                    </Button>
                  </div>
                )}

                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-[#FAF8F4] sticky top-0 z-10">
                      <tr className="border-b border-[#E5E2DA]">
                        <th className="p-3 w-10">
                          <input
                            type="checkbox"
                            checked={selectedCount === rows.length}
                            onChange={e => setRows(prev => prev.map(r => ({ ...r, __selected: e.target.checked })))}
                            className="w-4 h-4 rounded accent-[#6B8F71]"
                          />
                        </th>
                        <th className="p-3 font-serif text-[10px] font-bold uppercase text-[#5F5E60]">Referência (Título/Autores)</th>
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
                          <th key={key} className="p-3 font-serif text-[10px] font-bold uppercase text-[#5F5E60] whitespace-nowrap">
                            {key === "abstractNote" ? "abstract note" : key}
                          </th>
                        ))}
                        <th className="p-3 font-serif text-[10px] font-bold uppercase text-[#5F5E60]">Base / Fonte</th>
                        <th className="p-3 font-serif text-[10px] font-bold uppercase text-[#5F5E60]">Status</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E2DA]">
                      {filteredRows.map((r) => (
                        <tr key={r.__id} className={cn("group transition-colors", r.__duplicate ? "bg-amber-50/30" : "hover:bg-[#FAF8F4]/50")}>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={r.__selected}
                              onChange={e => updateRow(r.__id, { __selected: e.target.checked })}
                              className="w-4 h-4 rounded accent-[#6B8F71]"
                            />
                          </td>
                          <td className="p-3 max-w-sm">
                            <input
                              value={r.title}
                              onChange={e => updateRow(r.__id, { title: e.target.value })}
                              className="w-full bg-transparent border-none focus:ring-1 focus:ring-[#6B8F71] text-xs font-semibold text-[#1C1C1E] rounded px-1 transition-all"
                            />
                            <p className="text-[10px] text-[#5F5E60] truncate mt-0.5 px-1">{(r.authors || []).join(", ") || "Sem autores"}</p>
                          </td>
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
                            <td key={key} className="p-3 text-xs text-[#5F5E60] max-w-[150px] truncate">
                              {(r as any)[key] || "—"}
                            </td>
                          ))}
                          <td className="p-3">
                            <Select
                              value={r.database || ""}
                              onValueChange={v => updateRow(r.__id, { database: v })}
                            >
                              <SelectTrigger className={cn(
                                "h-8 text-[10px] font-bold border border-[#E5E2DA] bg-white hover:bg-[#FAF8F4] transition-all w-full min-w-[130px] shadow-sm",
                                !r.database && "text-[#ba1a1a] bg-red-50 border-red-200 ring-1 ring-red-100"
                              )}>
                                <SelectValue placeholder="Escolher..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-[#E5E2DA] z-[100]">
                                {(state.project?.databases || []).map(db => (
                                  <SelectItem key={db} value={db} className="text-xs">{db}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            {r.__duplicate ? (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] gap-1 px-1.5 py-0">
                                <AlertTriangle className="w-2.5 h-2.5" /> Duplicado
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-[9px] px-1.5 py-0">Novo</Badge>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setRows(prev => prev.filter(row => row.__id !== r.__id))}
                              className="opacity-0 group-hover:opacity-100 text-[#A1A1AA] hover:text-[#ba1a1a] p-1.5 rounded transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* History Card (when no preview) */
              <div className="bg-white rounded-xl border border-[#E5E2DA] shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-[#E5E2DA] flex justify-between items-center">
                  <h2 className="font-serif text-xl font-bold text-[#1C1C1E] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#A1A1AA]" />
                    Histórico de Importações
                  </h2>
                  <Badge variant="outline" className="text-[#A1A1AA] font-mono text-[10px]">
                    {state.imports.length} lotes
                  </Badge>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {state.imports.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-[#FAF8F4] rounded-full flex items-center justify-center text-[#E5E2DA]">
                        <CloudUpload className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-[#A1A1AA] font-medium italic">Ainda não foram realizadas importações.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-[#E5E2DA]">
                      {[...state.imports].reverse().map((b) => (
                        <li key={b.id} className="p-4 hover:bg-[#FAF8F4]/50 transition-colors flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#FAF8F4] rounded-lg flex items-center justify-center text-[#A1A1AA] shrink-0 border border-[#E5E2DA]">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#1C1C1E] truncate max-w-md">{b.filename}</p>
                              <div className="flex items-center gap-3 text-[10px] text-[#A1A1AA] font-mono mt-1">
                                <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date(b.date).toLocaleDateString()}</span>
                                <span className="uppercase">{b.format}</span>
                                {b.duplicates > 0 && <span className="text-amber-600 font-bold">{b.duplicates} DUPS</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-serif font-bold text-[#6B8F71]">+{b.imported}</span>
                            <span className="text-[9px] uppercase font-bold tracking-widest text-[#A1A1AA]">Referências</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              disabled={isDeleting === b.id}
                              onClick={() => setPendingDeleteBatch(b.id)}
                              className="h-7 mt-1.5 px-3 bg-[#ba1a1a]/5 text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white transition-all rounded-md font-bold text-[10px] uppercase tracking-widest border border-[#ba1a1a]/20 shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> {isDeleting === b.id ? "A reverter..." : "Reverter"}
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!pendingDeleteBatch} onOpenChange={(open) => !open && setPendingDeleteBatch(null)}>
        <AlertDialogContent className="border-[#E5E2DA] rounded-xl shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-[#1C1C1E] text-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />
              Reverter Importação
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#5F5E60] pt-2">
              Tem a certeza que deseja reverter esta importação? 
              <br/><br/>
              <strong>Todas as referências</strong> e os dados de triagem associados a este lote 
              serão apagados permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="border-[#E5E2DA] hover:bg-[#FAF8F4] text-[#5F5E60] font-bold rounded-lg h-10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => pendingDeleteBatch && handleDeleteBatch(pendingDeleteBatch)}
              className="bg-[#ba1a1a] hover:bg-[#a01616] text-white font-bold rounded-lg h-10"
            >
              Sim, Reverter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
