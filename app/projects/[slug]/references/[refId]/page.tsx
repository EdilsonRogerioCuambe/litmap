"use client"

import { useStore } from "@/lib/store"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Star,
  Trash2,
  BookOpen,
  Calendar,
  Database,
  Info,
  Quote,
  Clock,
  Globe,
  FileText,
  Tag,
  Layers,
  Hash,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Stage, Reference } from "@/lib/types"
import { STAGE_COLORS, STAGE_LABELS } from "@/lib/types"
import { updateReferenceAction, deleteReferenceAction } from "@/lib/actions/reference"

export default function ReferencePage() {
  const { state, updateReference, deleteReference: deleteRefStore } = useStore()
  const params = useParams()
  const router = useRouter()

  const slug = params.slug as string
  const refId = params.refId as string

  const reference = state.references.find(r => r.id === refId)

  const [stage, setStage] = useState<Stage>("identification")
  const [qualityScore, setQualityScore] = useState<number>(0)
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (reference) {
      setStage(reference.stage)
      setQualityScore(reference.qualityScore || 0)
      setNotes(reference.notes || "")
    }
  }, [reference])

  if (!state.project || !reference) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="w-16 h-16 bg-white border border-[#E5E2DA] rounded-2xl flex items-center justify-center text-[#E5E2DA] mb-6 shadow-sm">
          <Info className="w-8 h-8" />
        </div>
        <p className="font-serif text-lg text-[#5F5E60] italic">Referência não encontrada.</p>
        <Button
          variant="outline"
          onClick={() => router.push(`/projects/${slug}/references`)}
          className="mt-6 border-[#1C1C1E] rounded-xl"
        >
          Voltar à Biblioteca
        </Button>
      </div>
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    const toastId = toast.loading("A guardar alterações...")
    try {
      await updateReferenceAction(slug, refId, { stage, qualityScore, notes })
      updateReference(refId, { stage, qualityScore, notes })
      toast.success("Alterações guardadas com sucesso.", { id: toastId })
    } catch (err: any) {
      toast.error("Erro ao guardar: " + err.message, { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (confirm("Deseja mesmo eliminar esta referência? Esta ação não pode ser desfeita.")) {
      const toastId = toast.loading("A eliminar...")
      try {
        await deleteReferenceAction(slug, refId)
        deleteRefStore(refId)
        toast.success("Referência eliminada.", { id: toastId })
        router.push(`/projects/${slug}/references`)
      } catch (err: any) {
        toast.error("Erro ao eliminar: " + err.message, { id: toastId })
      }
    }
  }

  const sc = STAGE_COLORS[reference.stage]
  const extraction = state.extractions.find(e => e.referenceId === refId)

  return (
    <div className="flex flex-col min-h-full bg-[#FAF9F6]">

      {/* ── Sticky Toolbar ── */}
      <div className="h-16 bg-white/80 backdrop-blur-xl border-b border-[#E5E2DA] flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-[#5F5E60] hover:text-[#1C1C1E] hover:bg-[#FAF9F6] h-9 rounded-xl gap-2 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div className="h-5 w-px bg-[#E5E2DA] hidden sm:block" />
          <div
            className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest"
            style={{ background: sc.bg, color: sc.text }}
          >
            {STAGE_LABELS[reference.stage]}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {reference.url && (
            <Button variant="outline" size="sm" className="h-9 rounded-xl border-[#E5E2DA] gap-2 text-xs font-semibold hidden sm:flex" asChild>
              <a href={reference.url} target="_blank" rel="noreferrer">
                <ExternalLink className="w-3.5 h-3.5" /> Ver original
              </a>
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#1C1C1E] hover:bg-black text-white h-9 rounded-xl gap-2 font-semibold text-xs px-6 shadow-lg shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save className={cn("w-3.5 h-3.5", isSaving && "animate-spin")} />
            {isSaving ? "A guardar..." : "Guardar"}
          </Button>
        </div>
      </div>

      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-[1400px] mx-auto">

          {/* ── Hero Header ── */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-[10px] font-mono text-[#A1A1AA] bg-white border border-[#E5E2DA] px-2 py-0.5 rounded-md">
                ID: {reference.id.split('-')[0].toUpperCase()}
              </span>
              <span className="text-[10px] font-semibold text-[#A1A1AA] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Atualizado em {new Date(reference.updatedAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
            <h1 className="font-serif text-2xl lg:text-4xl font-bold text-[#1C1C1E] leading-[1.2] tracking-tight mb-6">
              {reference.title}
            </h1>

            {/* Meta pills */}
            <div className="flex flex-wrap items-center gap-3">
              {reference.authors.length > 0 && (
                <div className="flex items-center gap-2 bg-white border border-[#E5E2DA] rounded-full px-3 py-1.5 shadow-sm">
                  <Quote className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span className="text-xs font-semibold text-[#1C1C1E]">
                    {reference.authors.length === 1 ? reference.authors[0] :
                      reference.authors.length === 2 ? `${reference.authors[0]} & ${reference.authors[1]}` :
                        `${reference.authors[0]} et al.`}
                  </span>
                </div>
              )}
              {reference.year && (
                <div className="flex items-center gap-2 bg-white border border-[#E5E2DA] rounded-full px-3 py-1.5 shadow-sm">
                  <Calendar className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span className="text-xs font-bold text-[#1C1C1E] font-mono">{reference.year}</span>
                </div>
              )}
              {reference.journal && (
                <div className="flex items-center gap-2 bg-white border border-[#E5E2DA] rounded-full px-3 py-1.5 shadow-sm">
                  <Database className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span className="text-xs font-semibold text-[#6B8F71] italic truncate max-w-[240px]">{reference.journal}</span>
                </div>
              )}
              {reference.type && (
                <div className="flex items-center gap-2 bg-white border border-[#E5E2DA] rounded-full px-3 py-1.5 shadow-sm">
                  <FileText className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span className="text-xs font-semibold text-[#5F5E60]">{reference.type}</span>
                </div>
              )}
              {reference.database && (
                <div className="flex items-center gap-2 bg-white border border-[#E5E2DA] rounded-full px-3 py-1.5 shadow-sm">
                  <Globe className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span className="text-xs font-semibold text-[#5F5E60]">{reference.database}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Two-column Layout ── */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">

            {/* Left — Content Tabs */}
            <div className="min-w-0">
              <Tabs defaultValue="abstract" className="w-full">
                <TabsList className="bg-white border border-[#E5E2DA] p-1 h-11 rounded-2xl mb-6 w-fit">
                  <TabsTrigger value="abstract" className="rounded-xl px-5 text-xs font-bold data-[state=active]:bg-[#1C1C1E] data-[state=active]:text-white data-[state=active]:shadow-sm">
                    Abstract
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="rounded-xl px-5 text-xs font-bold data-[state=active]:bg-[#1C1C1E] data-[state=active]:text-white data-[state=active]:shadow-sm">
                    Anotações
                  </TabsTrigger>
                  {extraction && (
                    <TabsTrigger value="extraction" className="rounded-xl px-5 text-xs font-bold data-[state=active]:bg-[#1C1C1E] data-[state=active]:text-white data-[state=active]:shadow-sm">
                      Extração
                    </TabsTrigger>
                  )}
                  {reference.bibliographicExtras && Object.keys(reference.bibliographicExtras).length > 0 && (
                    <TabsTrigger value="extras" className="rounded-xl px-5 text-xs font-bold data-[state=active]:bg-[#1C1C1E] data-[state=active]:text-white data-[state=active]:shadow-sm">
                      Metadados
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* Abstract */}
                <TabsContent value="abstract" className="mt-0">
                  <div className="bg-white rounded-3xl border border-[#E5E2DA] shadow-sm overflow-hidden">
                    <div className="px-8 py-4 border-b border-[#F5F2ED] flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#6B8F71]" />
                      <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-widest">Abstract Note</span>
                    </div>
                    <div className="p-8 lg:p-10">
                      <div className="font-serif text-[18px] leading-[1.9] text-[#444444] whitespace-pre-wrap selection:bg-[#6B8F71]/10">
                        {reference.abstractNote || (reference.bibliographicExtras as any)?.["Abstract Note"] || (
                          <span className="italic text-[#A1A1AA] text-base">Nenhum resumo disponível para este registo.</span>
                        )}
                      </div>
                    </div>

                    {/* Keywords strip */}
                    {reference.keywords && reference.keywords.length > 0 && (
                      <div className="px-8 pb-8">
                        <div className="flex items-center gap-2 mb-3">
                          <Tag className="w-3.5 h-3.5 text-[#A1A1AA]" />
                          <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-widest">Palavras-chave</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {reference.keywords.map((k) => (
                            <Badge key={k} variant="secondary" className="bg-[#EAF1ED] text-[#5c7e6b] text-xs font-semibold px-3 py-1 rounded-full border-0">
                              {k}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Notes */}
                <TabsContent value="notes" className="mt-0">
                  <div className="bg-white rounded-3xl border border-[#E5E2DA] shadow-sm overflow-hidden">
                    <div className="px-8 py-4 border-b border-[#F5F2ED] flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#6B8F71]" />
                      <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-widest">As suas anotações</span>
                    </div>
                    <div className="p-8">
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Escreva aqui as suas notas de leitura, citações importantes ou observações metodológicas..."
                        className="min-h-[320px] bg-[#FAF9F6] border-[#E5E2DA] rounded-2xl focus-visible:ring-[#6B8F71] font-serif text-[16px] p-6 leading-[1.8] resize-none text-[#444444] placeholder:text-[#C8C2BB] placeholder:italic"
                      />
                      <div className="mt-4 flex justify-end">
                        <Button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="bg-[#6B8F71] hover:bg-[#5a7a60] text-white h-10 rounded-xl gap-2 font-semibold text-xs px-6"
                        >
                          <Save className={cn("w-3.5 h-3.5", isSaving && "animate-spin")} />
                          Guardar anotações
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Extraction */}
                {extraction && (
                  <TabsContent value="extraction" className="mt-0">
                    <div className="bg-white rounded-3xl border border-[#E5E2DA] shadow-sm overflow-hidden">
                      <div className="px-8 py-4 border-b border-[#F5F2ED] flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#6B8F71]" />
                        <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-widest">Dados Extraídos</span>
                      </div>
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { label: "Objectivo", value: extraction.objective },
                          { label: "País / Contexto", value: extraction.country },
                          { label: "Metodologia", value: extraction.methodology },
                          { label: "Participantes", value: [extraction.participantsContext, extraction.participantsN].filter(Boolean).join(" — ") },
                          { label: "Principais resultados", value: extraction.keyFindings },
                          { label: "Quadro teórico", value: extraction.theoreticalFramework },
                          { label: "Limitações", value: extraction.limitations },
                        ].filter(f => f.value).map(({ label, value }) => (
                          <div key={label} className="space-y-1.5">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">{label}</div>
                            <div className="text-[15px] font-serif text-[#444444] leading-relaxed">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                )}

                {/* Full Metadata Grid */}
                <TabsContent value="extras" className="mt-0">
                  <div className="bg-white rounded-3xl border border-[#E5E2DA] shadow-sm overflow-hidden">
                    <div className="px-8 py-4 border-b border-[#F5F2ED] flex items-center gap-2">
                      <Hash className="w-4 h-4 text-[#6B8F71]" />
                      <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-widest">Ficha Técnica Completa (Zotero)</span>
                    </div>
                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
                        {[
                          { k: "Item Type", v: reference.itemType },
                          { k: "Abstract Note", v: reference.abstractNote },
                          { k: "Título Curto", v: reference.shortTitle },
                          { k: "Ano", v: reference.year },
                          { k: "Data Publicação", v: reference.publicationDate },
                          { k: "Revista/Fonte", v: reference.journal },
                          { k: "Abrev. Revista", v: reference.journalAbbreviation },
                          { k: "DOI", v: reference.doi },
                          { k: "ISSN", v: reference.issn },
                          { k: "ISBN", v: reference.isbn },
                          { k: "Volume", v: reference.volume },
                          { k: "Issue / Fascículo", v: reference.issue },
                          { k: "Número", v: reference.number },
                          { k: "Páginas", v: reference.pages },
                          { k: "Nº Páginas", v: reference.numPages },
                          { k: "Editora", v: reference.publisher },
                          { k: "Local", v: reference.place },
                          { k: "Edição", v: reference.edition },
                          { k: "Idioma", v: reference.language },
                          { k: "Série", v: reference.series },
                          { k: "Nº Série", v: reference.seriesNumber },
                          { k: "Título Série", v: reference.seriesTitle },
                          { k: "Texto Série", v: reference.seriesText },
                          { k: "Biblioteca", v: reference.libraryCatalog },
                          { k: "Call Number", v: reference.callNumber },
                          { k: "Arquivo", v: reference.archive },
                          { k: "Local Arquivo", v: reference.archiveLocation },
                          { k: "Direitos / Rights", v: reference.rights },
                          { k: "Extra", v: reference.extra },
                          { k: "Zotero Key", v: reference.zoteroKey },
                          { k: "Data Adição", v: reference.dateAdded ? new Date(reference.dateAdded).toLocaleString() : null },
                          { k: "Data Modificação", v: reference.dateModified ? new Date(reference.dateModified).toLocaleString() : null },
                          { k: "Data Acesso", v: reference.accessDate },
                          { k: "Editor", v: reference.editor },
                          { k: "Editor da Série", v: reference.seriesEditor },
                          { k: "Tradutor", v: reference.translator },
                          { k: "Contribuinte", v: reference.contributor },
                          { k: "Autor do Livro", v: reference.bookAuthor },
                          { k: "Convidado", v: reference.guest },
                          { k: "Elenco", v: reference.castMember },
                          { k: "Argumentista", v: reference.scriptwriter },
                          { k: "Produtor", v: reference.producer },
                          { k: "Compositor", v: reference.composer },
                          { k: "País", v: reference.country },
                          { k: "Linguagem Prog.", v: reference.programmingLanguage },
                          { k: "Versão", v: reference.version },
                          { k: "Sistema", v: reference.system },
                          { k: "Estado Legal", v: reference.legalStatus },
                          { k: "Tribunal", v: reference.court },
                          { k: "Relator", v: reference.reporter },
                          { k: "Nº Pedido", v: reference.applicationNumber },
                          { k: "Cessionário", v: reference.assignee },
                          { k: "Autoridade Emissora", v: reference.issuingAuthority },
                          { k: "Nºs Prioridade", v: reference.priorityNumbers },
                          { k: "Código", v: reference.code },
                          { k: "Secção", v: reference.section },
                          { k: "Sessão", v: reference.session },
                          { k: "Comité", v: reference.committee },
                          { k: "Histórico", v: reference.history },
                          { k: "Órgão Legislativo", v: reference.legislativeBody },
                        ].filter(x => x.v).map((item) => (
                          <div key={item.k} className="space-y-1">
                            <div className="text-[10px] uppercase font-bold tracking-widest text-[#A1A1AA]">{item.k}</div>
                            <div className="text-sm font-semibold text-[#1C1C1E] break-words">{item.v}</div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Abstract Note Fallback Display */}
                      {!reference.abstractNote && (reference.bibliographicExtras as any)?.["Abstract Note"] && (
                        <div className="mt-12 p-6 bg-[#FAF9F6] rounded-2xl border border-[#E5E2DA]">
                           <div className="text-[10px] uppercase font-bold tracking-widest text-[#6B8F71] mb-2">Abstract Note (Recuperado)</div>
                           <p className="text-sm text-[#5F5E60] leading-relaxed italic">
                             {(reference.bibliographicExtras as any)["Abstract Note"]}
                           </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right — Side Panel */}
            <div className="space-y-5">

              {/* Flow Management */}
              <div className="bg-white rounded-3xl border border-[#E5E2DA] shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-[#F5F2ED] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#6B8F71]" />
                  <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-widest">Gestão de Fluxo</span>
                </div>
                <div className="p-5 space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">Fase Atual</label>
                    <Select value={stage} onValueChange={(v) => setStage(v as Stage)}>
                      <SelectTrigger className="h-11 rounded-xl border-[#E5E2DA] font-semibold text-sm bg-[#FAF9F6]">
                        <SelectValue placeholder="Selecione a fase" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="identification" className="text-sm">Identificação</SelectItem>
                        <SelectItem value="screening" className="text-sm">Triagem</SelectItem>
                        <SelectItem value="eligibility" className="text-sm">Elegibilidade</SelectItem>
                        <SelectItem value="included" className="text-sm font-bold text-[#6B8F71]">Incluído</SelectItem>
                        <SelectItem value="excluded" className="text-sm font-bold text-[#ba1a1a]">Excluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">Qualidade / Rigor</label>
                      <span className="text-[11px] font-bold font-mono text-[#c4914a]">{qualityScore}.0 / 5.0</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => setQualityScore(s === qualityScore ? 0 : s)}
                          className="transition-transform active:scale-90"
                        >
                          <Star className={cn(
                            "w-7 h-7 transition-all duration-300",
                            s <= qualityScore ? "fill-[#c4914a] text-[#c4914a]" : "text-[#E5E2DA] hover:text-[#c4914a]/40"
                          )} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-[#1C1C1E] hover:bg-black text-white rounded-xl h-11 font-semibold text-sm transition-all"
                  >
                    Atualizar Estado
                  </Button>
                </div>
              </div>

              {/* Bibliographic Info */}
              <div className="bg-white rounded-3xl border border-[#E5E2DA] shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-[#F5F2ED] flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#6B8F71]" />
                  <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-widest">Ficha Técnica</span>
                </div>
                <div className="p-5 space-y-4">
                  <SideItem label="DOI" value={reference.doi || "—"} mono />
                  <SideItem label="Tipo" value={reference.type || "Artigo"} />
                  <SideItem label="Páginas" value={(reference as any).pages || "—"} />
                  <SideItem label="Editora" value={(reference as any).publisher || "—"} />
                  <SideItem label="Idioma" value={(reference as any).language || "—"} />

                  {reference.doi && (
                    <a
                      href={`https://doi.org/${reference.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs font-semibold text-[#3a6fa8] hover:underline mt-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Abrir via DOI
                    </a>
                  )}
                  {reference.url && (
                    <a
                      href={reference.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs font-semibold text-[#3a6fa8] hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Ver original
                    </a>
                  )}
                </div>
              </div>

              {/* Exclusion info */}
              {reference.stage === "excluded" && reference.exclusionCategory && (
                <div className="bg-red-50 rounded-3xl border border-red-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-red-100 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest">Motivo de Exclusão</span>
                  </div>
                  <div className="p-5 space-y-1.5">
                    <div className="text-xs font-bold text-red-700">{reference.exclusionCategory}</div>
                    {reference.exclusionReason && (
                      <div className="text-xs text-red-600 leading-relaxed">{reference.exclusionReason}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              <div className="bg-white rounded-3xl border border-red-100 overflow-hidden">
                <div className="p-5">
                  <Button
                    variant="ghost"
                    onClick={handleDelete}
                    className="w-full text-[#ba1a1a] hover:bg-red-50 hover:text-[#ba1a1a] h-11 rounded-xl font-semibold text-sm gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar Referência
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function SideItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">{label}</div>
      <div className={cn("text-sm font-semibold text-[#1C1C1E] break-words", mono && "font-mono text-xs")}>{value}</div>
    </div>
  )
}
