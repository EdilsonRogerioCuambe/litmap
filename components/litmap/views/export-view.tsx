"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import { PageHeader } from "@/components/litmap/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Download, Copy, Check, FileJson, FileSpreadsheet, FileCode, FileText, Share2, ClipboardCheck } from "lucide-react"
import { citeAPA, citeVancouver, citeABNT, citePlain, toBibtex } from "@/lib/citations"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export type CitationStyle = "apa" | "vancouver" | "abnt" | "bibtex"

export function ExportView() {
  const { state } = useStore()
  const project = state.project
  const [style, setStyle] = useState<CitationStyle>("apa")
  const [copied, setCopied] = useState<string | null>(null)

  const includedRefs = useMemo(
    () => state.references.filter((r) => r.stage === "included"),
    [state.references],
  )

  const formattedReferences = useMemo(() => {
    return includedRefs
      .slice()
      .sort((a, b) => (a.authors[0] || "").localeCompare(b.authors[0] || ""))
      .map((r) => {
        if (style === "apa") return citeAPA(r)
        if (style === "vancouver") return citeVancouver(r)
        if (style === "abnt") return citeABNT(r)
        if (style === "bibtex") return toBibtex(r)
        return citePlain(r)
      })
  }, [includedRefs, style])

  if (!project) return null

  const handleCopyAll = async () => {
    const text = formattedReferences.join("\n\n").replace(/<[^>]*>?/gm, '')
    await navigator.clipboard.writeText(text)
    setCopied("all")
    toast.success("Todas as referências copiadas para a área de transferência.")
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDownloadTxt = () => {
    const text = formattedReferences.join("\n\n").replace(/<[^>]*>?/gm, '')
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    triggerDownload(blob, `referencias-${style}-${project.slug}.txt`)
  }

  const downloadCsv = () => {
    const header = ["id", "status", "title", "authors", "year", "journal", "doi", "abstractNote", "themes", "key_findings"]
    const rows = state.references.map((r) => {
      const ext = state.extractions.find((e) => e.referenceId === r.id)
      const refThemes = state.themes.filter((t) => t.referenceIds.includes(r.id)).map((t) => t.name)
      return [
        r.id,
        r.stage,
        r.title,
        r.authors.join("; "),
        String(r.year || ""),
        r.journal || "",
        r.doi || "",
        r.abstractNote || "",
        refThemes.join("; "),
        ext?.keyFindings || "",
      ]
    })
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    triggerDownload(blob, `extração-${project.slug}.csv`)
  }

  const downloadBibtex = () => {
    const bibs = includedRefs.map((r) => toBibtex(r)).join("\n\n")
    const blob = new Blob([bibs], { type: "application/x-bibtex;charset=utf-8" })
    triggerDownload(blob, `bibliografia-${project.slug}.bib`)
  }

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json;charset=utf-8" })
    triggerDownload(blob, `backup-${project.slug}.json`)
  }

  return (
    <div className="flex flex-col min-h-full bg-[#FAF8F4]">
      <PageHeader
        title="Exportar & Partilhar"
        subtitle="Descarregue os dados da sua investigação em formatos standard para submissão académica ou backup."
      />

      <div className="p-4 lg:p-8 space-y-8">
        
        {/* Main Export Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Formatted List Section */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            <Card className="rounded-2xl border-[#E5E2DA] shadow-sm overflow-hidden flex flex-col h-full bg-white">
              <div className="p-6 border-b border-[#E5E2DA] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF8F4]/30">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#1C1C1E]">Lista de Referências</h2>
                  <p className="text-xs text-[#5C5955] mt-1 font-medium italic">Baseada nos {includedRefs.length} estudos incluídos na síntese final.</p>
                </div>
                <div className="flex items-center gap-2">
                   <div className="space-y-1">
                    <Select value={style} onValueChange={(v) => setStyle(v as CitationStyle)}>
                      <SelectTrigger className="w-32 h-9 border-[#E5E2DA] rounded-lg text-xs font-bold font-serif">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="apa">APA 7</SelectItem>
                        <SelectItem value="vancouver">Vancouver</SelectItem>
                        <SelectItem value="abnt">ABNT</SelectItem>
                        <SelectItem value="bibtex">BibTeX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopyAll} className="h-9 rounded-lg border-[#E5E2DA] gap-2 text-xs font-bold font-serif">
                    {copied === "all" ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copiar
                  </Button>
                  <Button size="sm" onClick={handleDownloadTxt} className="bg-[#1C1C1E] hover:bg-black text-white h-9 rounded-lg gap-2 text-xs font-bold font-serif">
                    <Download className="w-3.5 h-3.5" /> TXT
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <Tabs defaultValue="formatted" className="w-full h-full flex flex-col">
                  <TabsList className="bg-[#FAF8F4] border border-[#E5E2DA] rounded-lg p-1 self-start mb-6">
                    <TabsTrigger value="formatted" className="text-xs font-bold rounded-md px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">Visualização</TabsTrigger>
                    <TabsTrigger value="raw" className="text-xs font-bold rounded-md px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">Raw Code</TabsTrigger>
                  </TabsList>

                  <TabsContent value="formatted" className="flex-1 mt-0">
                    {formattedReferences.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 opacity-40">
                         <FileText className="w-10 h-10 mb-2" />
                         <p className="text-sm italic font-medium">Nenhum estudo incluído para gerar a lista.</p>
                      </div>
                    ) : (
                      <ol className="space-y-6">
                        {formattedReferences.map((ref, i) => (
                          <li key={i} className="flex gap-4 group">
                            <span className="text-[10px] font-bold font-mono text-[#A1A1AA] w-6 pt-1">{String(i + 1).padStart(2, '0')}</span>
                            <div className="flex-1">
                              <p className="font-serif text-sm text-[#1C1C1E] leading-relaxed selection:bg-[#6B8F71]/20" dangerouslySetInnerHTML={{ __html: ref }} />
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </TabsContent>

                  <TabsContent value="raw" className="flex-1 mt-0">
                    <div className="relative group">
                       <pre className="p-6 bg-[#FAF8F4] border border-[#E5E2DA] rounded-xl text-[11px] font-mono leading-relaxed text-[#5F5E60] whitespace-pre-wrap h-full max-h-[500px] overflow-y-auto overflow-x-hidden">
                        {formattedReferences.join("\n\n").replace(/<[^>]*>?/gm, '')}
                      </pre>
                      <Button variant="ghost" size="sm" className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleCopyAll}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </Card>
          </div>

          {/* Quick Export Sidebar */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            
            <section className="space-y-4">
              <h3 className="font-serif text-sm font-bold text-[#1C1C1E] uppercase tracking-widest flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#6B8F71]" />
                Exportação de Dados
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <ExportOption 
                  icon={<FileSpreadsheet className="w-5 h-5 text-green-600" />}
                  title="Dataset de Extração"
                  format="CSV / Excel"
                  description="Planilha completa com referências, temas e dados PICO extraídos."
                  onClick={downloadCsv}
                />
                <ExportOption 
                  icon={<FileCode className="w-5 h-5 text-orange-600" />}
                  title="Biblioteca Bibliográfica"
                  format="BibTeX (.bib)"
                  description="Ficheiro pronto para importar no Zotero, Mendeley ou LaTeX."
                  onClick={downloadBibtex}
                />
                <ExportOption 
                  icon={<FileJson className="w-5 h-5 text-blue-600" />}
                  title="Backup do Projeto"
                  format="JSON (.json)"
                  description="Todo o estado do projeto, permitindo restauro total no LitMap."
                  onClick={downloadJson}
                />
              </div>
            </section>

            <div className="p-6 bg-[#FAF8F4] border border-[#E5E2DA] rounded-2xl">
              <h4 className="text-xs font-bold text-[#1C1C1E] mb-2">Dica Académica</h4>
              <p className="text-[11px] text-[#5F5E60] leading-relaxed italic">
                "Ao exportar para CSV, garantimos que todas as justificações de exclusão são incluídas, facilitando a transparência no seu relatório PRISMA final."
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function ExportOption({ icon, title, format, description, onClick }: { icon: React.ReactNode, title: string, format: string, description: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full text-left bg-white border border-[#E5E2DA] p-5 rounded-2xl hover:border-[#6B8F71] hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-[#FAF8F4] group-hover:bg-[#6B8F71]/10 transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-bold font-mono text-[#A1A1AA] uppercase">{format}</span>
      </div>
      <h4 className="text-sm font-bold text-[#1C1C1E] group-hover:text-[#6B8F71] transition-colors mb-1">{title}</h4>
      <p className="text-[11px] text-[#5C5955] leading-relaxed">{description}</p>
    </button>
  )
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function csvCell(v: string): string {
  if (v == null) return ""
  const s = String(v)
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}
