"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WorkspaceSidebar } from "@/components/litmap/workspace-sidebar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
  { id: "Scopus", name: "Scopus", icon: "auto_stories", desc: "Coleção abrangente de resumos e citações." },
  { id: "Web of Science", name: "Web of Science", icon: "science", desc: "Índice global de citação científica." },
  { id: "Google Scholar", name: "Google Scholar", icon: "school", desc: "Pesquisa acadêmica ampla." },
  { id: "IEEE Xplore", name: "IEEE Xplore", icon: "computer", desc: "Engenharia e tecnologia." },
  { id: "PubMed", name: "PubMed", icon: "biotech", desc: "Biomédica e ciências da vida." },
  { id: "ACM Digital Library", name: "ACM Digital Library", icon: "terminal", desc: "Literatura e publicações de Computação e TI." },
  { id: "SciELO", name: "SciELO", icon: "public", desc: "Acesso aberto ibero-americano." },
]

const LANGUAGES = ["Português", "Inglês", "Espanhol", "Francês", "Alemão"]

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Step 1
  const [title, setTitle] = useState("")
  const [question, setQuestion] = useState("")
  const [area, setArea] = useState("")
  const [reviewType, setReviewType] = useState("")

  // Step 2
  const [databases, setDatabases] = useState<string[]>([])
  const [searchStrings, setSearchStrings] = useState<Record<string, string>>({})
  const [yearFrom, setYearFrom] = useState("2018")
  const [yearTo, setYearTo] = useState("2024")
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  const [languages, setLanguages] = useState<string[]>(["Português", "Inglês"])

  // Step 3
  const [inclusionCriteria, setInclusionCriteria] = useState<string[]>([""])
  const [exclusionCriteria, setExclusionCriteria] = useState<string[]>([""])
  const [notes, setNotes] = useState("")

  const toggleDb = (db: string) => {
    setDatabases((prev) => (prev.includes(db) ? prev.filter((d) => d !== db) : [...prev, db]))
  }

  const toggleLang = (lang: string) => {
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]))
  }

  const addKeyword = () => {
    const kw = keywordInput.trim()
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw])
      setKeywordInput("")
    }
  }

  const removeKeyword = (kw: string) => setKeywords((prev) => prev.filter((k) => k !== kw))

  const addInclusion = () => setInclusionCriteria([...inclusionCriteria, ""])
  const removeInclusion = (idx: number) => setInclusionCriteria((prev) => prev.filter((_, i) => i !== idx))
  const updateInclusion = (idx: number, val: string) => setInclusionCriteria((prev) => prev.map((c, i) => (i === idx ? val : c)))

  const addExclusion = () => setExclusionCriteria([...exclusionCriteria, ""])
  const removeExclusion = (idx: number) => setExclusionCriteria((prev) => prev.filter((_, i) => i !== idx))
  const updateExclusion = (idx: number, val: string) => setExclusionCriteria((prev) => prev.map((c, i) => (i === idx ? val : c)))

  const canNext = () => {
    if (step === 1) return title.trim() !== "" && question.trim() !== "" && area !== "" && reviewType !== ""
    if (step === 2) return databases.length > 0 && keywords.length > 0
    return true
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    const payload = {
      title,
      researchQuestion: question,
      area,
      reviewType,
      databases,
      searchStrings,
      yearFrom: yearFrom ? parseInt(yearFrom) : null,
      yearTo: yearTo ? parseInt(yearTo) : null,
      keywords,
      languages,
      inclusionCriteria: inclusionCriteria.filter((c) => c.trim() !== ""),
      exclusionCriteria: exclusionCriteria.filter((c) => c.trim() !== ""),
      methodologicalNotes: notes,
    }

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erro ao criar projeto")
      }

      const data = await res.json()
      toast.success("Projeto criado com sucesso!")
      router.push(`/projects/${data.slug}/dashboard`)
    } catch (err: any) {
      toast.error(err.message || "Ocorreu um erro ao criar o projeto.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#18181b] selection:bg-secondary-container selection:text-on-secondary-container">
      <WorkspaceSidebar />

      <div className="flex-1 flex flex-col lg:ml-64 bg-background text-on-surface font-body-md h-screen overflow-hidden">
        <style dangerouslySetInnerHTML={{__html: `
          .shadow-academic {
              box-shadow: 0px 2px 10px rgba(28, 28, 30, 0.04);
          }
          .academic-checkbox:checked {
              background-color: var(--color-secondary);
              border-color: var(--color-secondary);
          }
          .step-inactive { border-color: var(--color-outline-variant); color: var(--color-outline); }
          .step-active { border-color: var(--color-secondary); color: var(--color-secondary); border-width: 2px; }
          .step-done { background-color: var(--color-secondary); color: var(--color-on-secondary); border-color: var(--color-secondary); }
        `}} />

        <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md border-b border-surface-variant h-16 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-h3-title text-xl tracking-tight text-primary">Novo Projeto</span>
          </div>
          <button onClick={() => router.push("/projects")} className="flex items-center gap-2 font-label-caps text-xs uppercase text-on-surface-variant hover:text-primary transition-colors">
            <span>Sair da Configuração</span>
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto w-full p-8 flex flex-col items-center">
          <div className="w-full max-w-3xl py-4 flex flex-col">
        {/* Progress Indicator */}
        <nav aria-label="Progress" className="mb-16 w-full px-4">
          <ol className="flex items-center w-full" role="list">
            {/* Step 1 */}
            <li className="relative flex-1 flex items-center">
              <button onClick={() => step > 1 && setStep(1)} className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors", step > 1 ? "step-done" : "step-active", step === 1 && "bg-background")}>
                {step > 1 ? <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span> : <span className="font-label-caps text-xs">1</span>}
              </button>
              <div className={cn("absolute top-4 left-8 right-0 h-[2px]", step > 1 ? "bg-secondary" : "bg-surface-variant")}></div>
              <span className={cn("absolute -bottom-7 left-4 -translate-x-1/2 font-label-caps text-xs uppercase whitespace-nowrap", step >= 1 ? "text-secondary font-bold" : "text-on-surface-variant")}>Identidade</span>
            </li>
            
            {/* Step 2 */}
            <li className="relative flex-1 flex items-center">
              <button onClick={() => step > 2 && setStep(2)} className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors bg-background border", step > 2 ? "step-done" : step === 2 ? "step-active" : "step-inactive")}>
                {step > 2 ? <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span> : <span className="font-label-caps text-xs">2</span>}
              </button>
              <div className={cn("absolute top-4 left-8 right-0 h-[2px]", step > 2 ? "bg-secondary" : "bg-surface-variant")}></div>
              <span className={cn("absolute -bottom-7 left-4 -translate-x-1/2 font-label-caps text-xs uppercase whitespace-nowrap", step >= 2 ? "text-secondary font-bold" : "text-on-surface-variant")}>Estratégia</span>
            </li>

            {/* Step 3 */}
            <li className="relative flex shrink-0 items-center">
              <button className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors bg-background border", step === 3 ? "step-active" : "step-inactive")}>
                <span className="font-label-caps text-xs">3</span>
              </button>
              <span className={cn("absolute -bottom-7 left-4 -translate-x-1/2 font-label-caps text-xs uppercase whitespace-nowrap", step === 3 ? "text-secondary font-bold" : "text-on-surface-variant")}>Síntese</span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col gap-12">
          {/* STEP 1: IDENTIDADE */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <header className="max-w-2xl mb-12">
                <h1 className="font-h1-display text-4xl text-primary mb-4">Identidade do Projeto</h1>
                <p className="font-body-lg text-lg text-on-surface-variant">
                  Defina a essência da sua revisão. O título, a questão de investigação e o tipo de estudo irão guiar todo o processo de mapeamento.
                </p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-xs text-on-surface-variant uppercase">Título da Revisão</label>
                    <Input 
                      value={title} onChange={(e) => setTitle(e.target.value)} 
                      placeholder="Ex: Gamificação no Ensino de Algoritmos..."
                      className="bg-surface-container-lowest border-outline-variant py-6 text-base focus-visible:ring-secondary focus-visible:border-secondary shadow-academic"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-xs text-on-surface-variant uppercase">Área do Conhecimento</label>
                    <Select value={area} onValueChange={setArea}>
                      <SelectTrigger className="bg-surface-container-lowest border-outline-variant py-6 text-base focus:ring-secondary focus:border-secondary shadow-academic">
                        <SelectValue placeholder="Selecciona a área" />
                      </SelectTrigger>
                      <SelectContent>
                        {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-xs text-on-surface-variant uppercase">Tipo de Revisão</label>
                    <Select value={reviewType} onValueChange={setReviewType}>
                      <SelectTrigger className="bg-surface-container-lowest border-outline-variant py-6 text-base focus:ring-secondary focus:border-secondary shadow-academic">
                        <SelectValue placeholder="Selecciona o tipo de revisão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mapeamento Sistemático">Mapeamento Sistemático</SelectItem>
                        <SelectItem value="Revisão Sistemática (PRISMA)">Revisão Sistemática (PRISMA)</SelectItem>
                        <SelectItem value="Revisão de Escopo (Scoping Review)">Revisão de Escopo (Scoping Review)</SelectItem>
                        <SelectItem value="Meta-análise">Meta-análise</SelectItem>
                        <SelectItem value="Revisão Integrativa">Revisão Integrativa</SelectItem>
                        <SelectItem value="Revisão Guarda-chuva">Revisão Guarda-chuva (Umbrella Review)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase">Pergunta de Investigação</label>
                  <Textarea 
                    value={question} onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ex: Como a gamificação influencia a aprendizagem de algoritmos?"
                    className="h-full min-h-[200px] resize-none bg-surface-container-lowest border-outline-variant text-base p-4 focus-visible:ring-secondary focus-visible:border-secondary shadow-academic"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ESTRATÉGIA */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <header className="max-w-2xl mb-12">
                <h1 className="font-h1-display text-4xl text-primary mb-4">Estratégia de Pesquisa</h1>
                <p className="font-body-lg text-lg text-on-surface-variant">
                  Defina o escopo da sua investigação. Selecione as bases de dados bibliográficas e estruture as palavras-chave que irão alimentar o motor de mapeamento do LitMap.
                </p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <section className="lg:col-span-7 flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-surface-variant pb-2">
                    <h2 className="font-h3-title text-2xl text-primary">Bases Bibliográficas</h2>
                    <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Múltipla Seleção</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {DATABASES.map(db => {
                      const isSelected = databases.includes(db.id)
                      return (
                        <label key={db.id} className={cn("relative flex flex-col p-6 cursor-pointer rounded-xl transition-all shadow-academic group", isSelected ? "border-2 border-secondary bg-surface-container-low" : "border border-surface-variant bg-surface-container-lowest hover:border-outline")}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleDb(db.id)}
                            className="academic-checkbox absolute top-6 right-6 h-5 w-5 rounded border-outline-variant text-secondary focus:ring-secondary focus:ring-offset-0 bg-transparent" 
                          />
                          <span className={cn("material-symbols-outlined text-[32px] mb-4 transition-colors", isSelected ? "text-secondary" : "text-on-surface-variant group-hover:text-primary")} style={isSelected ? { fontVariationSettings: "'FILL' 1" } : {}}>{db.icon}</span>
                          <span className="font-body-lg text-lg font-bold text-on-surface mb-1">{db.name}</span>
                          <span className="font-body-md text-sm text-on-surface-variant">{db.desc}</span>
                          
                          {/* Search String field inline for selected databases */}
                          {isSelected && (
                            <div className="mt-4 pt-4 border-t border-secondary/20" onClick={e => e.preventDefault()}>
                              <Input 
                                value={searchStrings[db.id] || ""}
                                onChange={(e) => setSearchStrings({...searchStrings, [db.id]: e.target.value})}
                                placeholder={`String de pesquisa em ${db.name}...`}
                                className="bg-background border-outline-variant h-8 text-xs font-mono"
                              />
                            </div>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </section>

                <section className="lg:col-span-5 flex flex-col gap-10">
                  {/* Período Temporal */}
                  <div className="flex flex-col gap-4">
                    <div className="border-b border-surface-variant pb-2">
                      <h2 className="font-h3-title text-2xl text-primary">Período Temporal</h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 flex flex-col gap-2">
                        <label className="font-label-caps text-xs text-on-surface-variant uppercase">Ano Inicial</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">calendar_today</span>
                          <input type="number" value={yearFrom} onChange={e => setYearFrom(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-md py-3 pl-10 pr-4 font-data-tabular text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors" placeholder="Ex: 2010" />
                        </div>
                      </div>
                      <span className="text-on-surface-variant pt-6">—</span>
                      <div className="flex-1 flex flex-col gap-2">
                        <label className="font-label-caps text-xs text-on-surface-variant uppercase">Ano Final</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">calendar_month</span>
                          <input type="number" value={yearTo} onChange={e => setYearTo(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-md py-3 pl-10 pr-4 font-data-tabular text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors" placeholder="Ex: 2024" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="flex flex-col gap-4">
                    <div className="border-b border-surface-variant pb-2">
                      <h2 className="font-h3-title text-2xl text-primary">Termos & Booleanos</h2>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-xs text-on-surface-variant uppercase">Adicionar Termo</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">label</span>
                          <input 
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                            type="text" 
                            className="w-full bg-surface-container-lowest border border-outline-variant rounded-md py-3 pl-10 pr-4 text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors" 
                            placeholder='Ex: "gamification" OR "game-based"' 
                          />
                        </div>
                        <button onClick={addKeyword} type="button" className="bg-surface-container hover:bg-surface-variant text-on-surface px-4 rounded-md border border-outline-variant transition-colors flex items-center justify-center">
                          <span className="material-symbols-outlined">add</span>
                        </button>
                      </div>
                    </div>
                    
                    {keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {keywords.map(kw => (
                          <div key={kw} className="inline-flex items-center gap-2 bg-surface-container rounded-full border border-surface-variant px-4 py-1.5 group">
                            <span className="font-label-caps text-xs text-on-surface font-medium uppercase tracking-wide">{kw}</span>
                            <button onClick={() => removeKeyword(kw)} className="text-on-surface-variant hover:text-error transition-colors flex items-center">
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* STEP 3: SÍNTESE E CRITÉRIOS */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <header className="max-w-2xl mb-12">
                <h1 className="font-h1-display text-4xl text-primary mb-4">Síntese e Critérios</h1>
                <p className="font-body-lg text-lg text-on-surface-variant">
                  Estipule os critérios rigorosos que determinarão a inclusão ou exclusão dos estudos no seu mapeamento sistemático.
                </p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Inclusão e Exclusão */}
                <div className="flex flex-col gap-8">
                  {/* Inclusion */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-surface-variant pb-2">
                      <h2 className="font-h3-title text-2xl text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-success">check_circle</span>
                        Critérios de Inclusão
                      </h2>
                      <button type="button" onClick={addInclusion} className="text-secondary hover:bg-secondary/10 px-2 py-1 rounded text-sm font-medium transition-colors">
                        + Adicionar
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {inclusionCriteria.map((c, i) => (
                        <div key={i} className="flex gap-2 relative">
                          <Input 
                            value={c} onChange={(e) => updateInclusion(i, e.target.value)}
                            placeholder="Ex: Estudos publicados em revistas com revisão por pares"
                            className="bg-surface-container-lowest border-outline-variant pr-10 shadow-sm focus-visible:ring-success focus-visible:border-success"
                          />
                          <button onClick={() => removeInclusion(i)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exclusion */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-surface-variant pb-2">
                      <h2 className="font-h3-title text-2xl text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-error">cancel</span>
                        Critérios de Exclusão
                      </h2>
                      <button type="button" onClick={addExclusion} className="text-secondary hover:bg-secondary/10 px-2 py-1 rounded text-sm font-medium transition-colors">
                        + Adicionar
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {exclusionCriteria.map((c, i) => (
                        <div key={i} className="flex gap-2 relative">
                          <Input 
                            value={c} onChange={(e) => updateExclusion(i, e.target.value)}
                            placeholder="Ex: Artigos que não apresentam validação empírica"
                            className="bg-surface-container-lowest border-outline-variant pr-10 shadow-sm focus-visible:ring-error focus-visible:border-error"
                          />
                          <button onClick={() => removeExclusion(i)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Languages and Notes */}
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4">
                    <div className="border-b border-surface-variant pb-2">
                      <h2 className="font-h3-title text-2xl text-primary">Idiomas Incluídos</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 bg-surface-container-low p-6 rounded-xl border border-surface-variant">
                      {LANGUAGES.map((lang) => (
                        <label key={lang} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={languages.includes(lang)}
                            onChange={() => toggleLang(lang)}
                            className="w-5 h-5 rounded border-outline-variant text-secondary focus:ring-secondary accent-secondary" 
                          />
                          <span className="text-on-surface font-medium group-hover:text-secondary transition-colors">{lang}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="border-b border-surface-variant pb-2">
                      <h2 className="font-h3-title text-2xl text-primary">Notas Metodológicas</h2>
                    </div>
                    <Textarea 
                      value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="Registe aqui quaisquer observações ou detalhes metodológicos adicionais sobre o protocolo da revisão..."
                      className="min-h-[140px] resize-none bg-surface-container-lowest border-outline-variant shadow-sm focus-visible:ring-secondary focus-visible:border-secondary"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <footer className="mt-16 pt-8 border-t border-surface-variant flex items-center justify-between pb-12">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="px-6 py-3 border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary font-label-caps text-xs uppercase tracking-wider rounded flex items-center gap-2 hover:bg-surface-container transition-colors" type="button">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Voltar
            </button>
          ) : (
            <div></div> /* Empty div to push 'Próximo' to the right */
          )}

          {step < 3 ? (
            <button 
              onClick={() => setStep(step + 1)} 
              disabled={!canNext()}
              className={cn("px-8 py-3 text-white font-label-caps text-xs uppercase tracking-wider rounded flex items-center gap-2 shadow-academic transition-colors", canNext() ? "bg-secondary hover:bg-secondary/90 text-on-secondary" : "bg-surface-dim text-outline opacity-50 cursor-not-allowed")} 
              type="button"
            >
              Continuar
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={isLoading || !canNext()}
              className={cn("px-8 py-3 font-label-caps text-xs uppercase tracking-wider rounded flex items-center gap-2 shadow-academic transition-colors", canNext() ? "bg-primary hover:bg-primary/90 text-on-primary" : "bg-surface-dim text-outline opacity-50 cursor-not-allowed")} 
              type="button"
            >
              {isLoading ? "A Processar..." : "Finalizar Mapeamento"}
              {!isLoading && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
            </button>
          )}
        </footer>
          </div>
        </main>
      </div>
    </div>
  )
}
