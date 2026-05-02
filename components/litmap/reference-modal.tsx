"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/lib/store"
import type { Reference, ReferenceType, Stage, ExclusionCategory } from "@/lib/types"
import { STAGE_COLORS, STAGE_LABELS, STAGES } from "@/lib/types"
import { Loader2, Search, X, ArrowRightLeft, FileWarning } from "lucide-react"
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
import { useParams } from "next/navigation"
import { addReferenceAction } from "@/lib/actions/reference"

const REFERENCE_TYPES: ReferenceType[] = [
  "Artigo",
  "Tese",
  "Capítulo de Livro",
  "Actas de Conferência",
  "Livro",
  "Relatório",
  "Outro",
]

export function AddReferenceModal({
  open,
  onOpenChange,
  initialStage = "identification",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStage?: Stage
}) {
  const { state, addReference } = useStore()
  const params = useParams()
  const slug = params.slug as string
  const [type, setType] = useState<ReferenceType>("Artigo")
  const [title, setTitle] = useState("")
  const [authors, setAuthors] = useState<string[]>([])
  const [authorInput, setAuthorInput] = useState("")
  const [year, setYear] = useState("")
  const [journal, setJournal] = useState("")
  const [doi, setDoi] = useState("")
  const [url, setUrl] = useState("")
  const [abstractNote, setAbstractNote] = useState("")
  const [database, setDatabase] = useState(state.project?.databases[0] || "")
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  const [stage, setStage] = useState<Stage>(initialStage)
  const [notes, setNotes] = useState("")
  const [doiSearch, setDoiSearch] = useState("")
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!open) {
      setType("Artigo")
      setTitle("")
      setAuthors([])
      setAuthorInput("")
      setYear("")
      setJournal("")
      setDoi("")
      setUrl("")
      setAbstractNote("")
      setDatabase(state.project?.databases[0] || "")
      setKeywords([])
      setKeywordInput("")
      setStage(initialStage)
      setNotes("")
      setDoiSearch("")
    }
  }, [open, initialStage, state.project?.databases])

  const addAuthor = () => {
    const a = authorInput.trim()
    if (a && !authors.includes(a)) {
      setAuthors([...authors, a])
      setAuthorInput("")
    }
  }

  const addKeyword = () => {
    const k = keywordInput.trim()
    if (k && !keywords.includes(k)) {
      setKeywords([...keywords, k])
      setKeywordInput("")
    }
  }

  const submit = async () => {
    if (!title.trim()) {
      toast.error("O título é obrigatório.")
      return
    }

    const payload = {
      title: title.trim(),
      authors,
      year: year ? parseInt(year, 10) : null,
      journal,
      doi: doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//, ""),
      url,
      abstractNote,
      keywords,
      database,
      type,
      stage,
      notes,
    }

    const toastId = toast.loading("A guardar referência...")
    try {
      const saved = await addReferenceAction(slug, payload)
      addReference(saved as unknown as Reference)
      toast.success("Referência adicionada com sucesso.", { id: toastId })
      onOpenChange(false)
    } catch (err: any) {
      toast.error("Erro ao adicionar: " + err.message, { id: toastId })
    }
  }

  const fakeDoiLookup = () => {
    if (!doiSearch.trim()) return
    setSearching(true)
    setTimeout(() => {
      setSearching(false)
      setTitle("Exemplo: artigo recuperado por DOI")
      setAuthors(["Exemplo, A.", "Pesquisador, B."])
      setYear("2023")
      setJournal("Journal of Examples")
      setDoi(doiSearch.trim())
      setAbstractNote(
        "Este é um abstract exemplificativo gerado a partir de uma simulação de procura por DOI. Substitui pelos dados reais do artigo.",
      )
      toast.success("Metadados simulados preenchidos. Revê e confirma.")
    }, 800)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Adicionar Referência</DialogTitle>
          <DialogDescription>
            Insere os dados manualmente ou pesquisa por DOI.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual">
          <TabsList className="bg-[#f0ede8]">
            <TabsTrigger value="manual">Adicionar Manualmente</TabsTrigger>
            <TabsTrigger value="doi">Pesquisa por DOI</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm">Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as ReferenceType)}>
                  <SelectTrigger className="border-[#e2ddd8]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REFERENCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Estágio inicial</Label>
                <Select value={stage} onValueChange={(v) => setStage(v as Stage)}>
                  <SelectTrigger className="border-[#e2ddd8]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STAGE_LABELS) as Stage[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm">
                Título<span className="text-[#b94040]">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Autores</Label>
              <div className="flex gap-2">
                <Input
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addAuthor()
                    }
                  }}
                  placeholder="Apelido, Nome — pressiona Enter"
                  className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b]"
                />
                <Button type="button" onClick={addAuthor} size="sm" variant="outline">
                  Adicionar
                </Button>
              </div>
              {authors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {authors.map((a, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="bg-[#f0ede8] text-[#18181b] gap-1"
                    >
                      {a}
                      <button onClick={() => setAuthors(authors.filter((_, x) => x !== i))}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm">Ano</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Base de dados</Label>
                <Select value={database} onValueChange={setDatabase}>
                  <SelectTrigger className="border-[#e2ddd8]">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {(state.project?.databases || []).map((db) => (
                      <SelectItem key={db} value={db}>
                        {db}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Revista / Fonte</Label>
              <Input
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm">DOI</Label>
                <Input
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  placeholder="10.xxxx/xxxxx"
                  className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b] font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">URL</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://"
                  className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b] font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#5F5E60] uppercase">Abstract Note</Label>
              <Textarea
                placeholder="Introduz o abstract do artigo..."
                className="min-h-[120px] bg-[#FAF8F4] border-[#E5E2DA] focus:ring-[#6B8F71] text-sm"
                value={abstractNote}
                onChange={(e) => setAbstractNote(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Palavras-chave</Label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addKeyword()
                    }
                  }}
                  placeholder="Pressiona Enter para adicionar"
                  className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b]"
                />
                <Button type="button" onClick={addKeyword} size="sm" variant="outline">
                  Adicionar
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {keywords.map((k, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="bg-[#eaf1ed] text-[#5c7e6b] gap-1"
                    >
                      {k}
                      <button onClick={() => setKeywords(keywords.filter((_, x) => x !== i))}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Notas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={submit}
                style={{ background: "var(--accent)" }}
                className="text-white"
              >
                Adicionar Referência
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="doi" className="space-y-4 mt-4">
            <p className="text-sm text-[#5c5955]">
              Insere o DOI e o LitMap simula o preenchimento dos metadados. Como o app é
              totalmente cliente, esta funcionalidade é uma demonstração — os dados devem ser
              revistos manualmente.
            </p>
            <div className="flex gap-2">
              <Input
                value={doiSearch}
                onChange={(e) => setDoiSearch(e.target.value)}
                placeholder="10.1016/j.compedu.2022.104512"
                className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b] font-mono text-xs"
              />
              <Button
                onClick={fakeDoiLookup}
                disabled={searching}
                style={{ background: "var(--accent)" }}
                className="text-white gap-2"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Buscar metadados
              </Button>
            </div>

            {title && (
              <div className="bg-[#f0ede8] rounded-md p-4 text-sm space-y-1.5">
                <div className="font-serif text-base">{title}</div>
                <div className="text-[#5c5955]">
                  {authors.join(", ")} · {year}
                </div>
                <div className="italic text-[#5c5955]">{journal}</div>
                <div className="font-mono text-xs">{doi}</div>
                <div className="pt-2 line-clamp-3 text-[#5c5955]">{abstractNote}</div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={submit}
                    size="sm"
                    style={{ background: "var(--accent)" }}
                    className="text-white"
                  >
                    Confirmar e adicionar
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export function ReferenceDetailModal({
  reference,
  open,
  onOpenChange,
  onMove,
  onQuickExclude,
}: {
  reference: Reference | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMove?: (id: string, target: Stage) => void
  onQuickExclude?: (id: string, cat: ExclusionCategory, reason: string) => void
}) {
  const { state } = useStore()
  const extraction = useMemo(
    () => state.extractions.find((e) => e.referenceId === reference?.id),
    [state.extractions, reference?.id],
  )

  if (!reference) return null

  const sc = STAGE_COLORS[reference.stage]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-none w-[min(1120px,95vw)] max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0 rounded-3xl border-[#E5E2DA] shadow-2xl"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-8 pt-7 pb-5 border-b border-[#E5E2DA] bg-white">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: sc.bg, color: sc.text }}
                >
                  {STAGE_LABELS[reference.stage]}
                </span>
                <span className="text-[10px] font-mono text-[#A1A1AA] bg-[#FAF9F6] px-2 py-0.5 rounded border border-[#E5E2DA]">
                  ID: {reference.id.split('-')[0]}
                </span>
              </div>
              <DialogTitle className="font-serif text-2xl lg:text-3xl font-bold text-[#1C1C1E] leading-tight tracking-tight">
                {reference.title}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-[#5F5E60] font-medium">
                {reference.authors.join(", ")}
                {reference.year ? <span className="mx-2 text-[#E5E2DA]">·</span> : null}
                {reference.year && <span className="font-mono">{reference.year}</span>}
                {reference.journal ? <span className="mx-2 text-[#E5E2DA]">·</span> : null}
                {reference.journal && <span className="italic text-[#6B8F71]">{reference.journal}</span>}
              </DialogDescription>
            </div>
            
            {/* Quick Actions */}
            <div className="flex shrink-0 gap-2 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-[#1C1C1E] text-[#1C1C1E] rounded-xl font-bold text-xs gap-2 h-9 px-4">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Ações Rápidas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-xl border-[#E5E2DA]">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2 text-xs">
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Mover para...
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="rounded-xl border-[#E5E2DA]">
                      {STAGES.filter((s) => s !== reference.stage).map((s) => (
                        <DropdownMenuItem
                          key={s}
                          className="gap-2 text-xs"
                          onClick={() => {
                            onMove?.(reference.id, s)
                            onOpenChange(false)
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

                  {reference.stage !== "excluded" && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="gap-2 text-xs text-[#B94040] focus:text-[#B94040]">
                        <X className="w-3.5 h-3.5" /> Excluir rapidamente
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="rounded-xl border-[#E5E2DA] w-52">
                        {[
                          { cat: "Duplicado", reason: "Identificado como duplicado na triagem rápida." },
                          { cat: "Tese/Dissertação", reason: "Trabalho académico (tese/dissertação) fora do escopo." },
                          { cat: "Capítulo de Livro", reason: "Capítulo de livro fora do escopo." },
                          { cat: "Livro", reason: "Livro (monografia) fora do escopo." },
                          { cat: "Remoção por Título", reason: "Título não relacionado com o tema." },
                        ].map(({ cat, reason }) => (
                          <DropdownMenuItem
                            key={cat}
                            className="text-xs"
                            onClick={() => {
                              onQuickExclude?.(reference.id, cat as ExclusionCategory, reason)
                              onOpenChange(false)
                            }}
                          >
                            {cat}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex-1 overflow-hidden flex min-h-0">

          {/* Left column — metadata sidebar */}
          <div className="w-72 flex-shrink-0 border-r border-[#E5E2DA] bg-[#FAF9F6] overflow-y-auto py-6 px-6 space-y-5">
            <MetaField label="Tipo" value={reference.type} />
            <MetaField label="Base de dados" value={reference.database} />
            <MetaField label="Ano" value={reference.year ? String(reference.year) : null} mono />
            
            {[
              { k: "Item Type", v: reference.itemType },
              { k: "Idioma", v: reference.language },
              { k: "ISBN", v: reference.isbn },
              { k: "ISSN", v: reference.issn },
              { k: "Páginas", v: reference.pages },
              { k: "Nº Páginas", v: reference.numPages },
              { k: "Editora", v: reference.publisher },
              { k: "Local", v: reference.place },
              { k: "Edição", v: reference.edition },
              { k: "Volume", v: reference.volume },
              { k: "Issue", v: reference.issue },
              { k: "Número", v: reference.number },
              { k: "Série", v: reference.series },
              { k: "Nº Série", v: reference.seriesNumber },
              { k: "Arquivo", v: reference.archive },
              { k: "Local Arquivo", v: reference.archiveLocation },
              { k: "Biblioteca", v: reference.libraryCatalog },
              { k: "Call Number", v: reference.callNumber },
              { k: "Extra", v: reference.extra },
              { k: "Ficheiros", v: reference.fileAttachments },
              { k: "Links", v: reference.linkAttachments },
              { k: "Editor", v: reference.editor },
              { k: "País", v: reference.country },
              { k: "Tribunal", v: reference.court },
              { k: "Relator", v: reference.reporter },
              { k: "Estado Legal", v: reference.legalStatus },
              { k: "Sistema", v: reference.system },
              { k: "Código", v: reference.code },
              { k: "Secção", v: reference.section },
              { k: "Sessão", v: reference.session },
              { k: "Comité", v: reference.committee },
              { k: "Órgão Legislativo", v: reference.legislativeBody },
              { k: "Zotero Key", v: reference.zoteroKey },
            ].filter(x => x.v).map(field => (
              <MetaField key={field.k} label={field.k} value={field.v!} />
            ))}

            {reference.doi && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">DOI</div>
                <a
                  href={`https://doi.org/${reference.doi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-[#3a6fa8] hover:underline break-all"
                >
                  {reference.doi}
                </a>
              </div>
            )}
            {reference.url && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">URL</div>
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-[#3a6fa8] hover:underline break-all block"
                >
                  Ver original ↗
                </a>
              </div>
            )}
            {reference.keywords.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Palavras-chave</div>
                <div className="flex flex-wrap gap-1.5">
                  {reference.keywords.map((k) => (
                    <Badge key={k} variant="secondary" className="bg-[#EAF1ED] text-[#5c7e6b] text-[10px] font-semibold px-2 py-0.5">
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {reference.stage === "excluded" && reference.exclusionCategory && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-red-500">Excluído</div>
                <div className="text-xs font-semibold text-red-700">{reference.exclusionCategory}</div>
                {reference.exclusionReason && (
                  <div className="text-xs text-red-600 leading-relaxed">{reference.exclusionReason}</div>
                )}
              </div>
            )}
          </div>

          {/* Right column — tabs */}
          <div className="flex-1 min-w-0 overflow-y-auto bg-white">
            <Tabs defaultValue="abstract" className="h-full flex flex-col">
              <TabsList className="flex-shrink-0 bg-[#F5F2ED] rounded-none border-b border-[#E5E2DA] px-6 pt-4 pb-0 h-auto gap-1 justify-start">
                  <TabsTrigger
                    value="abstract"
                    className="rounded-t-xl rounded-b-none px-5 py-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#6B8F71] data-[state=active]:text-[#6B8F71]"
                  >
                    Abstract Note
                  </TabsTrigger>
                <TabsTrigger
                  value="extraction"
                  className="rounded-t-xl rounded-b-none px-5 py-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#6B8F71] data-[state=active]:text-[#6B8F71]"
                >
                  Extracção
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="rounded-t-xl rounded-b-none px-5 py-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#6B8F71] data-[state=active]:text-[#6B8F71]"
                >
                  Notas
                </TabsTrigger>
                <TabsTrigger
                  value="metadata"
                  className="rounded-t-xl rounded-b-none px-5 py-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#6B8F71] data-[state=active]:text-[#6B8F71]"
                >
                  Ficha Técnica
                </TabsTrigger>
                {reference.bibliographicExtras && Object.keys(reference.bibliographicExtras).length > 0 && (
                  <TabsTrigger
                    value="raw"
                    className="rounded-t-xl rounded-b-none px-5 py-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#6B8F71] data-[state=active]:text-[#6B8F71]"
                  >
                    Metadados Originais
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="abstract" className="flex-1 p-8 overflow-y-auto">
                <div className="font-serif text-[18px] leading-[1.9] text-[#444444] whitespace-pre-wrap selection:bg-[#6B8F71]/10">
                  {reference.abstractNote || (reference.bibliographicExtras as any)?.["Abstract Note"] || (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <span className="italic text-[#A1A1AA] text-base">Nenhum resumo (Abstract Note) disponível.</span>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="flex-1 p-8 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                  {[
                    { k: "Item Type", v: reference.itemType },
                    { k: "Abstract Note", v: reference.abstractNote },
                    { k: "Ano", v: reference.year },
                    { k: "Revista/Fonte", v: reference.journal },
                    { k: "DOI", v: reference.doi },
                    { k: "URL", v: reference.url },
                    { k: "ISSN", v: reference.issn },
                    { k: "ISBN", v: reference.isbn },
                    { k: "Páginas", v: reference.pages },
                    { k: "Editora", v: reference.publisher },
                    { k: "Local", v: reference.place },
                    { k: "Edição", v: reference.edition },
                    { k: "Volume", v: reference.volume },
                    { k: "Número", v: reference.number },
                    { k: "Série", v: reference.series },
                    { k: "Arquivo", v: reference.archive },
                    { k: "Biblioteca", v: reference.libraryCatalog },
                    { k: "Extra", v: reference.extra },
                    { k: "Zotero Key", v: reference.zoteroKey },
                    { k: "País", v: reference.country },
                    { k: "Tribunal", v: reference.court },
                    { k: "Estado Legal", v: reference.legalStatus },
                  ].filter(x => x.v).map((item) => (
                    <div key={item.k} className="space-y-1 border-b border-[#F5F2ED] pb-3">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-[#A1A1AA]">{item.k}</div>
                      <div className="text-sm font-semibold text-[#1C1C1E] break-words">{item.v}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="extraction" className="flex-1 p-8 space-y-5">
                {extraction ? (
                  <>
                    <ExtField label="Objectivo">{extraction.objective || "—"}</ExtField>
                    <ExtField label="País / Contexto">{extraction.country || "—"}</ExtField>
                    <ExtField label="Metodologia">{extraction.methodology || "—"}</ExtField>
                    <ExtField label="Participantes">
                      {[extraction.participantsContext, extraction.participantsN].filter(Boolean).join(" — ") || "—"}
                    </ExtField>
                    <ExtField label="Principais resultados">{extraction.keyFindings || "—"}</ExtField>
                    <ExtField label="Quadro teórico">{extraction.theoreticalFramework || "—"}</ExtField>
                    <ExtField label="Limitações">{extraction.limitations || "—"}</ExtField>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <p className="text-sm text-[#A1A1AA] italic">Sem dados de extracção registados para esta referência.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="flex-1 p-8">
                <p className="font-serif text-[17px] leading-[1.9] text-[#444444] whitespace-pre-wrap">
                  {reference.notes || (
                    <span className="italic text-[#A1A1AA] text-base">Sem notas registadas.</span>
                  )}
                </p>
              </TabsContent>

              {reference.bibliographicExtras && Object.keys(reference.bibliographicExtras).length > 0 && (
                <TabsContent value="raw" className="flex-1 p-8">
                  <div className="rounded-2xl border border-[#E5E2DA] overflow-hidden">
                    {Object.entries(reference.bibliographicExtras).map(([key, value], i) => (
                      <div
                        key={key}
                        className={`grid grid-cols-[180px_1fr] gap-4 items-start px-5 py-3 ${
                          i % 2 === 0 ? "bg-[#FAF9F6]" : "bg-white"
                        } border-b border-[#E5E2DA]/60 last:border-0`}
                      >
                        <div className="text-[10px] uppercase font-bold tracking-widest text-[#A1A1AA] pt-0.5 break-all">{key}</div>
                        <div className="text-xs font-mono text-[#5F5E60] break-all leading-relaxed">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#A1A1AA] italic mt-3">
                    * Campos extraídos directamente do ficheiro original.
                  </p>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MetaField({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">{label}</div>
      <div className={`text-sm font-semibold text-[#1C1C1E] break-words ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  )
}

function ExtField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 pb-5 border-b border-[#FAF9F6] last:border-0">
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">{label}</div>
      <div className="text-[15px] text-[#444444] leading-relaxed font-serif">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 items-start">
      <div className="text-[10px] uppercase tracking-widest text-[#A1A1AA] font-bold pt-0.5">
        {label}
      </div>
      <div className="min-w-0 text-sm font-semibold text-[#1C1C1E]">{children}</div>
    </div>
  )
}
