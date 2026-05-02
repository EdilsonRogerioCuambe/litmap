"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateProjectAction, UpdateProjectInput } from "@/lib/actions/project"
import { useStore } from "@/lib/store"
import { ProjectLog } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Clock, Download, FileText, Filter, History, Plus, Trash2, User, X } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "../page-header"
import { Badge } from "@/components/ui/badge"

const AREAS = [
  "Educação / Pedagogia",
  "Ciências da Saúde",
  "Ciências Sociais",
  "Direito",
  "Ciência da Computação",
  "Engenharia",
  "Psicologia",
  "Urban Studies & Technology",
  "Environmental Engineering",
  "Outra",
]

const DATABASES = [
  "ACM Digital Library",
  "BDTD",
  "ERIC",
  "Embase",
  "Google Scholar",
  "IEEE Xplore",
  "JSTOR",
  "PubMed",
  "PsycINFO",
  "SciELO",
  "Scopus",
  "Springer Link",
  "Web of Science",
]

const LANGUAGES = ["Português", "Inglês", "Espanhol", "Francês", "Alemão"]

// Maps legacy/shorthand DB values to the current canonical SelectItem values
const REVIEW_TYPE_NORMALIZE: Record<string, string> = {
  "PRISMA": "Revisão Sistemática (PRISMA)",
  "prisma": "Revisão Sistemática (PRISMA)",
  "Scoping": "Revisão de Escopo (Scoping Review)",
  "Scoping Review": "Revisão de Escopo (Scoping Review)",
  "Meta": "Meta-análise",
  "Integrativa": "Revisão Integrativa",
  "Umbrella": "Revisão Guarda-chuva (Umbrella Review)",
}
function normalizeReviewType(val: string | null | undefined): string {
  if (!val) return ""
  return REVIEW_TYPE_NORMALIZE[val] ?? val
}

const FRAMEWORK_NORMALIZE: Record<string, string> = {
  "PRISMA": "PRISMA 2020",
  "prisma": "PRISMA 2020",
  "pico": "PICO",
  "Pico": "PICO",
  "picos": "PICOS",
  "spider": "SPIDER",
  "kitchenham": "Kitchenham",
  "prospero": "PROSPERO"
}

function normalizeFramework(val: string | null | undefined): string {
  if (!val) return ""
  return FRAMEWORK_NORMALIZE[val] ?? val
}

export function SettingsView() {
  const { state, importState } = useStore()
  const params = useParams()
  const slug = params.slug as string

  const [activeTab, setActiveTab] = useState("geral")
  const [isSaving, setIsSaving] = useState(false)

  const currentProject = state.project

  // Forms State
  const [generalForm, setGeneralForm] = useState({
    title: "",
    researchQuestion: "",
    area: "",
    reviewType: "",
    reviewFramework: "",
    methodologicalNotes: ""
  })

  const [strategyForm, setStrategyForm] = useState({
    databases: [] as string[],
    searchStrings: {} as Record<string, string>,
    yearFrom: "",
    yearTo: "",
    keywords: [] as string[],
    languages: [] as string[]
  })

  const [criteriaForm, setCriteriaForm] = useState({
    inclusionCriteria: [] as string[],
    exclusionCriteria: [] as string[]
  })

  const [exportForm, setExportForm] = useState({
    format: "RIS",
    includeAbstracts: true,
    includeExclusions: true,
    includeNotes: true,
    includeHistory: false
  })

  useEffect(() => {
    if (currentProject) {
      setGeneralForm({
        title: currentProject.title || "",
        researchQuestion: currentProject.researchQuestion || "",
        area: currentProject.area || "",
        reviewType: normalizeReviewType(currentProject.reviewType),
        reviewFramework: normalizeFramework(currentProject.reviewFramework),
        methodologicalNotes: currentProject.methodologicalNotes || ""
      })

      setStrategyForm({
        databases: currentProject.databases || [],
        searchStrings: (currentProject.searchStrings as Record<string, string>) || {},
        yearFrom: currentProject.yearFrom?.toString() || "",
        yearTo: currentProject.yearTo?.toString() || "",
        keywords: currentProject.keywords || [],
        languages: currentProject.languages || []
      })

      setCriteriaForm({
        inclusionCriteria: currentProject.inclusionCriteria || [],
        exclusionCriteria: currentProject.exclusionCriteria || []
      })

      const expPrefs = currentProject.exportPreferences as any || {}
      setExportForm({
        format: expPrefs.format || "RIS",
        includeAbstracts: expPrefs.includeAbstracts ?? true,
        includeExclusions: expPrefs.includeExclusions ?? true,
        includeNotes: expPrefs.includeNotes ?? true,
        includeHistory: expPrefs.includeHistory ?? false
      })
    }
  }, [currentProject]) // Re-run whenever the project object reference changes in the store

  const handleSave = async (payload: UpdateProjectInput) => {
    setIsSaving(true)
    try {
      const updatedProject = await updateProjectAction(slug, payload)

      // Update Store
      if (importState) {
        importState({
          ...state,
          project: updatedProject as any // Prisma include result is compatible with our Project type
        })
      }

      toast.success("Alterações guardadas com sucesso!")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ocorreu um erro ao guardar."
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const saveGeneral = (e: React.FormEvent) => {
    e.preventDefault()
    handleSave(generalForm)
  }

  const saveStrategy = (e: React.FormEvent) => {
    e.preventDefault()
    handleSave({
      ...strategyForm,
      yearFrom: strategyForm.yearFrom ? parseInt(strategyForm.yearFrom) : null,
      yearTo: strategyForm.yearTo ? parseInt(strategyForm.yearTo) : null
    })
  }

  const saveCriteria = (e: React.FormEvent) => {
    e.preventDefault()
    handleSave(criteriaForm)
  }

  const saveExport = (e: React.FormEvent) => {
    e.preventDefault()
    handleSave({
      exportPreferences: exportForm
    })
  }

  if (!currentProject) return null

  return (
    <div className="flex flex-col min-h-full bg-[#f7f4ef]">
      <PageHeader
        title="Definições do Projeto"
        subtitle="Configure os parâmetros e identidade da sua revisão sistemática."
      />

      <div className="p-8 max-w-[1280px] mx-auto w-full">
        <div className="flex gap-6 items-start">
          {/* Vertical Tabs */}
          <aside className="w-64 shrink-0 bg-white border border-[#e2ddd8] rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden">
            <nav className="flex flex-col">
              <TabItem label="Geral" isActive={activeTab === "geral"} onClick={() => setActiveTab("geral")} />
              <TabItem label="Estratégia" isActive={activeTab === "estrategia"} onClick={() => setActiveTab("estrategia")} />
              <TabItem label="Critérios" isActive={activeTab === "criterios"} onClick={() => setActiveTab("criterios")} />
              <TabItem label="Atividade" isActive={activeTab === "atividade"} onClick={() => setActiveTab("atividade")} />
              <TabItem label="Exportação" isActive={activeTab === "exportacao"} onClick={() => setActiveTab("exportacao")} />
            </nav>
          </aside>

          {/* Settings Canvas */}
          <div className="flex-1 flex flex-col gap-8">
            {activeTab === "geral" && (
              <section className="bg-white p-8 border border-[#e2ddd8] rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-6 pb-4 border-b border-[#e2ddd8]">
                  <h3 className="font-serif text-2xl mb-1 text-[#18181b]">Geral</h3>
                  <p className="text-sm text-[#5c5955]">Informações da identidade do projeto e notas metodológicas.</p>
                </div>
                <form onSubmit={saveGeneral} className="space-y-6">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#18181b]">Título do Projeto</Label>
                    <Input
                      value={generalForm.title}
                      onChange={e => setGeneralForm({...generalForm, title: e.target.value})}
                      required
                      className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#18181b]">Pergunta de Investigação</Label>
                    <Textarea
                      value={generalForm.researchQuestion}
                      onChange={e => setGeneralForm({...generalForm, researchQuestion: e.target.value})}
                      required
                      rows={3}
                      className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-[#18181b]">Área de Pesquisa</Label>
                      <Select value={generalForm.area} onValueChange={v => setGeneralForm({...generalForm, area: v})}>
                        <SelectTrigger className="border-[#e2ddd8] focus:ring-[#5c7e6b]">
                          <SelectValue placeholder="Selecione a área" />
                        </SelectTrigger>
                        <SelectContent>
                          {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-[#18181b]">Tipo de Revisão</Label>
                      <Select value={generalForm.reviewType || undefined} onValueChange={v => setGeneralForm({...generalForm, reviewType: v})}>
                        <SelectTrigger className="border-[#e2ddd8] focus:ring-[#5c7e6b]">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mapeamento Sistemático">Mapeamento Sistemático</SelectItem>
                          <SelectItem value="Revisão Sistemática (PRISMA)">Revisão Sistemática (PRISMA)</SelectItem>
                          <SelectItem value="Revisão Sistemática">Revisão Sistemática</SelectItem>
                          <SelectItem value="Revisão de Escopo (Scoping Review)">Revisão de Escopo (Scoping Review)</SelectItem>
                          <SelectItem value="Meta-análise">Meta-análise</SelectItem>
                          <SelectItem value="Revisão Integrativa">Revisão Integrativa</SelectItem>
                          <SelectItem value="Revisão Guarda-chuva (Umbrella Review)">Revisão Guarda-chuva (Umbrella Review)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#18181b]">Framework / Protocolo Metodológico</Label>
                    <Select value={generalForm.reviewFramework || undefined} onValueChange={v => setGeneralForm({...generalForm, reviewFramework: v})}>
                      <SelectTrigger className="border-[#e2ddd8] focus:ring-[#5c7e6b]">
                        <SelectValue placeholder="Selecione o protocolo (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRISMA 2020">PRISMA 2020</SelectItem>
                        <SelectItem value="PRISMA-P">PRISMA-P (Protocolo)</SelectItem>
                        <SelectItem value="PRISMA-ScR">PRISMA-ScR (Scoping Reviews)</SelectItem>
                        <SelectItem value="PICO">PICO</SelectItem>
                        <SelectItem value="SPIDER">SPIDER</SelectItem>
                        <SelectItem value="PICOS">PICOS</SelectItem>
                        <SelectItem value="Kitchenham">Kitchenham (SLR)</SelectItem>
                        <SelectItem value="PROSPERO">PROSPERO</SelectItem>
                        <SelectItem value="Outro">Outro / Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#18181b]">Notas Metodológicas</Label>
                    <Textarea
                      value={generalForm.methodologicalNotes}
                      onChange={e => setGeneralForm({...generalForm, methodologicalNotes: e.target.value})}
                      rows={4}
                      placeholder="Observações adicionais sobre a metodologia do projeto..."
                      className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b] resize-none"
                    />
                  </div>

                  <div className="pt-6 border-t border-[#e2ddd8] flex justify-end">
                    <Button
                      disabled={isSaving}
                      type="submit"
                      className="bg-[#5c7e6b] text-white hover:bg-[#4a6556] min-w-[160px]"
                    >
                      {isSaving ? "A guardar..." : "Guardar Alterações"}
                    </Button>
                  </div>
                </form>
              </section>
            )}

            {activeTab === "estrategia" && (
              <section className="bg-white p-8 border border-[#e2ddd8] rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-6 pb-4 border-b border-[#e2ddd8]">
                  <h3 className="font-serif text-2xl mb-1 text-[#18181b]">Estratégia de Pesquisa</h3>
                  <p className="text-sm text-[#5c5955]">Bases de dados, período temporal e palavras-chave.</p>
                </div>
                <form onSubmit={saveStrategy} className="space-y-8">

                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-[#18181b]">Bases de Dados & Strings de Busca</Label>
                    <div className="grid grid-cols-1 gap-4">
                      {DATABASES.map((db) => (
                        <div key={db} className="p-4 border border-[#e2ddd8] rounded-lg bg-[#f7f4ef]/30">
                          <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold mb-2">
                            <input
                              type="checkbox"
                              checked={strategyForm.databases.includes(db)}
                              onChange={() => {
                                const newDbs = strategyForm.databases.includes(db)
                                  ? strategyForm.databases.filter(d => d !== db)
                                  : [...strategyForm.databases, db]
                                setStrategyForm({...strategyForm, databases: newDbs})
                              }}
                              className="accent-[#5c7e6b]"
                            />
                            {db}
                          </label>
                          {strategyForm.databases.includes(db) && (
                            <Textarea
                              value={strategyForm.searchStrings[db] || ""}
                              onChange={(e) => setStrategyForm({
                                ...strategyForm,
                                searchStrings: { ...strategyForm.searchStrings, [db]: e.target.value }
                              })}
                              placeholder={`String de pesquisa no ${db}...`}
                              className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b] text-xs font-mono h-20 resize-none bg-white"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#e2ddd8]">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-[#18181b]">Ano de Início</Label>
                      <Input
                        type="number"
                        value={strategyForm.yearFrom}
                        onChange={e => setStrategyForm({...strategyForm, yearFrom: e.target.value})}
                        className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b]"
                        placeholder="Ex: 2018"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-[#18181b]">Ano de Fim</Label>
                      <Input
                        type="number"
                        value={strategyForm.yearTo}
                        onChange={e => setStrategyForm({...strategyForm, yearTo: e.target.value})}
                        className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b]"
                        placeholder="Ex: 2024"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-[#e2ddd8]">
                    <Label className="text-sm font-medium text-[#18181b]">Palavras-chave</Label>
                    <div className="flex gap-2">
                      <Input
                        id="kw-input"
                        placeholder="Adicionar palavra-chave..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            const val = (e.target as HTMLInputElement).value.trim()
                            if (val && !strategyForm.keywords.includes(val)) {
                              setStrategyForm({...strategyForm, keywords: [...strategyForm.keywords, val]})
                              ;(e.target as HTMLInputElement).value = ""
                            }
                          }
                        }}
                        className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b]"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {strategyForm.keywords.map(kw => (
                        <Badge key={kw} variant="secondary" className="bg-[#5c7e6b]/10 text-[#5c7e6b] border-[#5c7e6b]/20 px-2 py-1 gap-1">
                          {kw}
                          <button onClick={() => setStrategyForm({...strategyForm, keywords: strategyForm.keywords.filter(k => k !== kw)})}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-[#e2ddd8]">
                    <Label className="text-sm font-medium text-[#18181b]">Idiomas Incluídos</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {LANGUAGES.map(lang => (
                        <label key={lang} className="flex items-center gap-2 cursor-pointer select-none text-sm">
                          <input
                            type="checkbox"
                            checked={strategyForm.languages.includes(lang)}
                            onChange={() => {
                              const newLangs = strategyForm.languages.includes(lang)
                                ? strategyForm.languages.filter(l => l !== lang)
                                : [...strategyForm.languages, lang]
                              setStrategyForm({...strategyForm, languages: newLangs})
                            }}
                            className="accent-[#5c7e6b]"
                          />
                          {lang}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#e2ddd8] flex justify-end">
                    <Button
                      disabled={isSaving}
                      type="submit"
                      className="bg-[#5c7e6b] text-white hover:bg-[#4a6556] min-w-[160px]"
                    >
                      {isSaving ? "A guardar..." : "Guardar Estratégia"}
                    </Button>
                  </div>
                </form>
              </section>
            )}

            {activeTab === "criterios" && (
              <section className="bg-white p-8 border border-[#e2ddd8] rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-6 pb-4 border-b border-[#e2ddd8]">
                  <h3 className="font-serif text-2xl mb-1 text-[#18181b]">Critérios de Elegibilidade</h3>
                  <p className="text-sm text-[#5c5955]">Gere os critérios de inclusão e exclusão usados na triagem.</p>
                </div>
                <form onSubmit={saveCriteria} className="space-y-8">

                  <DynamicListInput
                    label="Critérios de Inclusão"
                    items={criteriaForm.inclusionCriteria}
                    onChange={(items) => setCriteriaForm({...criteriaForm, inclusionCriteria: items})}
                    placeholder="Escreva um critério de inclusão e pressione Enter"
                  />

                  <DynamicListInput
                    label="Critérios de Exclusão"
                    items={criteriaForm.exclusionCriteria}
                    onChange={(items) => setCriteriaForm({...criteriaForm, exclusionCriteria: items})}
                    placeholder="Escreva um critério de exclusão e pressione Enter"
                  />

                  <div className="pt-6 border-t border-[#e2ddd8] flex justify-end">
                    <Button
                      disabled={isSaving}
                      type="submit"
                      className="bg-[#5c7e6b] text-white hover:bg-[#4a6556] min-w-[160px]"
                    >
                      {isSaving ? "A guardar..." : "Guardar Critérios"}
                    </Button>
                  </div>
                </form>
              </section>
            )}

            {activeTab === "atividade" && (
              <section className="bg-white p-8 border border-[#e2ddd8] rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-6 pb-4 border-b border-[#e2ddd8]">
                  <div className="flex items-center gap-2 mb-1">
                    <History className="w-5 h-5 text-[#5c7e6b]" />
                    <h3 className="font-serif text-2xl text-[#18181b]">Atividade do Projeto</h3>
                  </div>
                  <p className="text-sm text-[#5c5955]">Histórico completo de alterações e colaboração.</p>
                </div>

                <div className="space-y-4">
                  {currentProject.logs && currentProject.logs.length > 0 ? (
                    currentProject.logs.map((log: ProjectLog) => (
                      <div key={log.id} className="flex gap-4 p-4 border border-[#e2ddd8] rounded-lg hover:bg-[#f7f4ef]/30 transition-colors">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                          log.action.includes("IDENTITY") ? "bg-blue-50 text-blue-600" :
                          log.action.includes("CRITERIA") ? "bg-green-50 text-green-600" :
                          log.action.includes("EXPORT") ? "bg-purple-50 text-purple-600" :
                          "bg-gray-50 text-gray-600"
                        )}>
                          {log.action.includes("IDENTITY") ? <FileText className="w-5 h-5" /> :
                           log.action.includes("CRITERIA") ? <Filter className="w-5 h-5" /> :
                           log.action.includes("EXPORT") ? <Download className="w-5 h-5" /> :
                           <User className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-medium text-[#18181b] truncate">{log.user?.name || "Utilizador"}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#f7f4ef] text-[#5c5955]">
                              {log.action.replace("UPDATE_", "")}
                            </span>
                          </div>
                          <p className="text-sm text-[#5c5955] mb-2">{log.details}</p>
                          <div className="flex items-center gap-1 text-[11px] text-[#a1a1aa]">
                            <Clock className="w-3 h-3" />
                            {new Date(log.createdAt).toLocaleString("pt-PT", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-[#e2ddd8] rounded-xl">
                      <History className="w-12 h-12 text-[#e2ddd8] mb-4" />
                      <p className="text-[#5c5955] font-medium">Ainda não existem registos de atividade.</p>
                      <p className="text-xs text-[#a1a1aa] mt-1">As alterações feitas pela equipa aparecerão aqui.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === "exportacao" && (
              <section className="bg-white p-8 border border-[#e2ddd8] rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-6 pb-4 border-b border-[#e2ddd8]">
                  <h3 className="font-serif text-2xl mb-1 text-[#18181b]">Preferências de Exportação</h3>
                  <p className="text-sm text-[#5c5955]">Configura como os dados são exportados.</p>
                </div>
                <form onSubmit={saveExport} className="space-y-6">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#18181b]">Formato de Citação Padrão</Label>
                    <Select value={exportForm.format} onValueChange={v => setExportForm({...exportForm, format: v})}>
                      <SelectTrigger className="border-[#e2ddd8] focus:ring-[#5c7e6b]">
                        <SelectValue placeholder="Selecione o formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RIS">RIS (Research Information Systems)</SelectItem>
                        <SelectItem value="BIB">BibTeX (.bib)</SelectItem>
                        <SelectItem value="CSV">CSV / Excel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-[#e2ddd8]">
                    <Label className="text-sm font-medium text-[#18181b]">Campos a incluir na exportação CSV</Label>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exportForm.includeAbstracts}
                        onChange={e => setExportForm({...exportForm, includeAbstracts: e.target.checked})}
                        className="w-4 h-4 accent-[#5c7e6b]"
                      />
                      <span className="text-sm text-[#18181b]">Abstracts Completos</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exportForm.includeExclusions}
                        onChange={e => setExportForm({...exportForm, includeExclusions: e.target.checked})}
                        className="w-4 h-4 accent-[#5c7e6b]"
                      />
                      <span className="text-sm text-[#18181b]">Motivos de Exclusão (Screening Phase)</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exportForm.includeNotes}
                        onChange={e => setExportForm({...exportForm, includeNotes: e.target.checked})}
                        className="w-4 h-4 accent-[#5c7e6b]"
                      />
                      <span className="text-sm text-[#18181b]">Notas de Extração e Síntese</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exportForm.includeHistory}
                        onChange={e => setExportForm({...exportForm, includeHistory: e.target.checked})}
                        className="w-4 h-4 accent-[#5c7e6b]"
                      />
                      <span className="text-sm text-[#18181b]">Histórico de Alterações de Revisor</span>
                    </label>
                  </div>

                  <div className="pt-6 border-t border-[#e2ddd8] flex justify-end">
                    <Button
                      disabled={isSaving}
                      type="submit"
                      className="bg-[#5c7e6b] text-white hover:bg-[#4a6556] min-w-[160px]"
                    >
                      {isSaving ? "A guardar..." : "Guardar Preferências"}
                    </Button>
                  </div>
                </form>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TabItem({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-6 py-4 text-left font-medium text-sm transition-colors border-l-4",
        isActive
          ? "border-[#5c7e6b] text-[#5c7e6b] bg-[#f7f4ef]/50"
          : "border-transparent text-[#5c5955] hover:bg-[#f7f4ef] hover:text-[#18181b]"
      )}
    >
      {label}
    </button>
  )
}

function DynamicListInput({ label, items, onChange, placeholder }: { label: string, items: string[], onChange: (items: string[]) => void, placeholder: string }) {
  const [inputValue, setInputValue] = useState("")

  const handleAdd = () => {
    if (inputValue.trim()) {
      onChange([...items, inputValue.trim()])
      setInputValue("")
    }
  }

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-[#18181b]">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAdd()
            }
          }}
          className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b]"
          placeholder={placeholder}
        />
        <Button
          type="button"
          onClick={handleAdd}
          variant="outline"
          className="shrink-0 border-[#e2ddd8] gap-1"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </div>
      {items.length > 0 && (
        <div className="mt-4 space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-start bg-[#f7f4ef] border border-[#e2ddd8] p-3 rounded-md text-sm text-[#18181b] shadow-sm">
              <span className="leading-snug">{item}</span>
              <Button
                type="button"
                onClick={() => handleRemove(index)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
