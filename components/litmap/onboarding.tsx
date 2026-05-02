"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Project } from "@/lib/types"
import { useStore } from "@/lib/store"
import { uid } from "@/lib/sample-data"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

const AREAS = [
  "Educação / Pedagogia",
  "Ciências da Saúde",
  "Ciências Sociais",
  "Direito",
  "Ciência da Computação",
  "Engenharia",
  "Psicologia",
  "Outra",
]

const DATABASES = [
  "ERIC",
  "Scopus",
  "Web of Science",
  "Google Scholar",
  "IEEE Xplore",
  "PubMed",
  "ACM Digital Library",
  "BDTD",
  "SciELO",
  "Springer Link",
  "JSTOR",
  "Embase",
  "PsycINFO",
]

const LANGUAGES = ["Português", "Inglês", "Espanhol", "Francês", "Alemão"]

export function Onboarding() {
  const router = useRouter()
  const { setProject, loadSample } = useStore()
  const [step, setStep] = useState(1)
  const [showDemo, setShowDemo] = useState(false)

  // Step 1
  const [title, setTitle] = useState("")
  const [question, setQuestion] = useState("")
  const [area, setArea] = useState("")
  const [reviewType, setReviewType] = useState("Mapeamento Sistemático")

  // Step 2
  const [databases, setDatabases] = useState<string[]>([])
  const [searchStrings, setSearchStrings] = useState<Record<string, string>>({})
  const [otherDb, setOtherDb] = useState("")
  const [yearFrom, setYearFrom] = useState("")
  const [yearTo, setYearTo] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  const [languages, setLanguages] = useState<string[]>(["Português", "Inglês"])
  const [otherLang, setOtherLang] = useState("")

  // Step 3
  const [inclusionCriteria, setInclusionCriteria] = useState<string[]>([])
  const [exclusionCriteria, setExclusionCriteria] = useState<string[]>([])
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

  const addInclusion = () => {
    setInclusionCriteria([...inclusionCriteria, ""])
  }
  const removeInclusion = (idx: number) => {
    setInclusionCriteria((prev) => prev.filter((_, i) => i !== idx))
  }
  const updateInclusion = (idx: number, val: string) => {
    setInclusionCriteria((prev) => prev.map((c, i) => (i === idx ? val : c)))
  }

  const addExclusion = () => {
    setExclusionCriteria([...exclusionCriteria, ""])
  }
  const removeExclusion = (idx: number) => {
    setExclusionCriteria((prev) => prev.filter((_, i) => i !== idx))
  }
  const updateExclusion = (idx: number, val: string) => {
    setExclusionCriteria((prev) => prev.map((c, i) => (i === idx ? val : c)))
  }

  const canNext = () => {
    if (step === 1) return title.trim() !== "" && question.trim() !== "" && area !== ""
    if (step === 2) return databases.length > 0 && keywords.length > 0
    return true
  }

  const submit = () => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || uid("p")
    const proj: Project = {
      id: uid("proj"),
      slug,
      title,
      researchQuestion: question,
      area,
      reviewType,
      databases: [...databases, ...(otherDb ? [otherDb] : [])],
      searchStrings,
      yearFrom: yearFrom ? parseInt(yearFrom, 10) : null,
      yearTo: yearTo ? parseInt(yearTo, 10) : null,
      keywords,
      languages: [...languages, ...(otherLang ? [otherLang] : [])],
      inclusionCriteria: inclusionCriteria.filter((c) => c.trim() !== ""),
      exclusionCriteria: exclusionCriteria.filter((c) => c.trim() !== ""),
      methodologicalNotes: notes,
      reviewFramework: "",
      exportPreferences: {
        format: "csv",
        includeAbstracts: true,
        includeExclusions: true,
        includeNotes: true,
        includeHistory: true
      },
      status: "active",
      isFavorite: false,
      prismaNotes: "",
      prismaChecklist: {},
      customScreeningColumns: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setProject(proj)
    router.push(`/projects/${slug}/dashboard`)
  }

  const handleLoadSample = () => {
    loadSample()
    router.push(`/projects/gamificacao-no-ensino-de-algoritmos/dashboard`)
  }

  if (showDemo) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-[#e2ddd8] rounded-[10px] p-8 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          <h2 className="font-serif text-2xl mb-4">Começar com dados de exemplo?</h2>
          <p className="text-[#5c5955] text-sm leading-relaxed mb-6">
            Podemos carregar um projecto de demonstração sobre gamificação no ensino de
            algoritmos para te ajudar a explorar o LitMap. Ou podes começar do zero.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => setShowDemo(false)} variant="outline" className="flex-1">
              Começar do zero
            </Button>
            <Button onClick={handleLoadSample} style={{ background: "var(--accent)" }} className="flex-1 text-white">
              Carregar exemplo
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo & tagline */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-5xl text-[#18181b]">LitMap</h1>
          <p className="text-sm text-[#5c5955] mt-2 leading-snug">
            Mapeamento sistemático da literatura, organizado com rigor e elegância.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step >= s
                  ? "bg-[#5c7e6b] text-white"
                  : "bg-white border border-[#e2ddd8] text-[#9c9894]",
              )}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white border border-[#e2ddd8] rounded-[10px] p-8 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-serif text-2xl mb-1">Identidade do Projecto</h2>
                <p className="text-sm text-[#5c5955] leading-snug">
                  Informações gerais sobre a tua revisão sistemática.
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="title" className="text-sm font-medium">
                  Título da revisão<span className="text-[#b94040]">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Gamificação no Ensino de Algoritmos e Estruturas de Dados"
                  className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b]"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="question" className="text-sm font-medium">
                  Pergunta de investigação principal<span className="text-[#b94040]">*</span>
                </Label>
                <Textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ex: Como a gamificação influencia a aprendizagem de algoritmos no ensino superior?"
                  rows={3}
                  className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b] resize-none"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="area" className="text-sm font-medium">
                  Área do conhecimento<span className="text-[#b94040]">*</span>
                </Label>
                <Select value={area} onValueChange={setArea}>
                  <SelectTrigger className="border-[#e2ddd8] focus:ring-[#5c7e6b]">
                    <SelectValue placeholder="Selecciona a área" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="reviewType" className="text-sm font-medium">
                  Tipo de revisão
                </Label>
                <Select value={reviewType} onValueChange={setReviewType}>
                  <SelectTrigger className="border-[#e2ddd8] focus:ring-[#5c7e6b]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mapeamento Sistemático">Mapeamento Sistemático</SelectItem>
                    <SelectItem value="Revisão Sistemática">Revisão Sistemática</SelectItem>
                    <SelectItem value="Meta-análise">Meta-análise</SelectItem>
                    <SelectItem value="Scoping Review">Scoping Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-serif text-2xl mb-1">Estratégia de Pesquisa</h2>
                <p className="text-sm text-[#5c5955] leading-snug">
                  Bases de dados, período temporal e palavras-chave.
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  Bases de dados consultadas<span className="text-[#b94040]">*</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DATABASES.map((db) => (
                    <div key={db} className="flex flex-col gap-2">
                      <label
                        className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold"
                      >
                        <input
                          type="checkbox"
                          checked={databases.includes(db)}
                          onChange={() => toggleDb(db)}
                          className="accent-[#5c7e6b]"
                        />
                        {db}
                      </label>
                      {databases.includes(db) && (
                        <Textarea
                          value={searchStrings[db] || ""}
                          onChange={(e) => setSearchStrings({ ...searchStrings, [db]: e.target.value })}
                          placeholder={`String de pesquisa no ${db}...`}
                          className="ml-6 border-[#e2ddd8] focus-visible:ring-[#5c7e6b] text-xs font-mono h-16 resize-none"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <Input
                  placeholder="Outra (especifica)"
                  value={otherDb}
                  onChange={(e) => setOtherDb(e.target.value)}
                  className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b] mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="yearFrom" className="text-sm font-medium">
                    Ano de início
                  </Label>
                  <Input
                    id="yearFrom"
                    type="number"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    placeholder="2018"
                    className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="yearTo" className="text-sm font-medium">
                    Ano de fim
                  </Label>
                  <Input
                    id="yearTo"
                    type="number"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    placeholder="2024"
                    className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b]"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  Palavras-chave utilizadas<span className="text-[#b94040]">*</span>
                </Label>
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
                    placeholder="Escreve e pressiona Enter"
                    className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b]"
                  />
                  <Button
                    type="button"
                    onClick={addKeyword}
                    size="sm"
                    style={{ background: "var(--accent)" }}
                    className="text-white shrink-0"
                  >
                    Adicionar
                  </Button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {keywords.map((kw) => (
                      <Badge
                        key={kw}
                        variant="secondary"
                        className="bg-[#eaf1ed] text-[#5c7e6b] border-[#5c7e6b] hover:bg-[#d8e7e0] flex items-center gap-1"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => removeKeyword(kw)}
                          className="hover:text-[#b94040]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Idiomas incluídos</Label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map((lang) => (
                    <label
                      key={lang}
                      className="flex items-center gap-2 cursor-pointer select-none text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={languages.includes(lang)}
                        onChange={() => toggleLang(lang)}
                        className="accent-[#5c7e6b]"
                      />
                      {lang}
                    </label>
                  ))}
                </div>
                <Input
                  placeholder="Outro (especifica)"
                  value={otherLang}
                  onChange={(e) => setOtherLang(e.target.value)}
                  className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b] mt-2"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-serif text-2xl mb-1">Critérios</h2>
                <p className="text-sm text-[#5c5955] leading-snug">
                  Define os teus critérios de inclusão e exclusão.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Critérios de inclusão</Label>
                  <Button
                    type="button"
                    onClick={addInclusion}
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="w-3 h-3" /> Adicionar
                  </Button>
                </div>
                {inclusionCriteria.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={c}
                      onChange={(e) => updateInclusion(i, e.target.value)}
                      placeholder="Ex: Estudos publicados entre 2015 e 2024"
                      className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b]"
                    />
                    <Button
                      type="button"
                      onClick={() => removeInclusion(i)}
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Critérios de exclusão</Label>
                  <Button
                    type="button"
                    onClick={addExclusion}
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="w-3 h-3" /> Adicionar
                  </Button>
                </div>
                {exclusionCriteria.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={c}
                      onChange={(e) => updateExclusion(i, e.target.value)}
                      placeholder="Ex: Estudos sem revisão por pares"
                      className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b]"
                    />
                    <Button
                      type="button"
                      onClick={() => removeExclusion(i)}
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notas metodológicas (opcional)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Quaisquer observações adicionais sobre a metodologia..."
                  rows={3}
                  className="border-[#e2ddd8] focus-visible:ring-[#5c7e6b] resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center gap-3">
          {step > 1 ? (
            <Button
              onClick={() => setStep(step - 1)}
              variant="outline"
              className="gap-2 border-[#c8c2bb]"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </Button>
          ) : (
            <Button onClick={() => setShowDemo(true)} variant="ghost" className="text-[#5c5955]">
              Ver dados de exemplo
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              style={{ background: canNext() ? "var(--accent)" : undefined }}
              className="gap-2 text-white"
            >
              Continuar <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              style={{ background: canNext() ? "var(--accent)" : undefined }}
              className="gap-2 text-white"
            >
              Criar Projecto
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
