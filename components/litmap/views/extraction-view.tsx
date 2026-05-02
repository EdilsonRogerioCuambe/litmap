"use client"

import { useState, useMemo } from "react"
import { useStore } from "@/lib/store"
import { PageHeader } from "@/components/litmap/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Save, FileSearch, Plus, X, CheckCircle2, FileText, Info, GraduationCap, Microscope, ListChecks } from "lucide-react"
import { toast } from "sonner"
import type { Extraction } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ExtractionView() {
  const { state, upsertExtraction } = useStore()
  const project = state.project

  const includedRefs = useMemo(
    () => state.references.filter((r) => r.stage === "included"),
    [state.references],
  )

  const [activeIndex, setActiveIndex] = useState(0)

  if (!project) return null

  if (includedRefs.length === 0) {
    return (
      <div className="flex flex-col min-h-full bg-[#FAF8F4]">
        <PageHeader
          title="Extração de Dados"
          subtitle="Analise e capture os dados estruturados de cada estudo incluído no protocolo."
        />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-white border border-[#E5E2DA] rounded-3xl flex items-center justify-center text-[#E5E2DA] mb-6 shadow-sm">
            <FileSearch className="w-10 h-10" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1C1C1E] mb-2">Sem estudos para extração</h2>
          <p className="text-[#5C5955] max-w-sm leading-relaxed">
            Mova referências para a fase <strong>Incluído</strong> no Quadro de Triagem para começar a extrair dados estruturados.
          </p>
          <Button
            variant="outline"
            className="mt-8 border-[#1C1C1E] text-[#1C1C1E] hover:bg-[#1C1C1E] hover:text-white rounded-xl px-8"
            onClick={() => window.location.href = `/projects/${project.slug}/kanban`}
          >
            Ir para Triagem
          </Button>
        </div>
      </div>
    )
  }

  const current = includedRefs[Math.min(activeIndex, includedRefs.length - 1)]

  return (
    <div className="flex flex-col min-h-full bg-[#FAF8F4]">
      <PageHeader
        title="Extração & Síntese"
        subtitle={`Processando estudos incluídos: ${includedRefs.length} referências prontas para análise.`}
      />

      <div className="flex-1 flex flex-col xl:flex-row gap-8 p-4 lg:p-8 overflow-hidden">

        {/* Master List: Included Studies */}
        <aside className="xl:w-80 shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Lista de Estudos</span>
            <Badge variant="secondary" className="bg-white border-[#E5E2DA] text-[#1C1C1E] font-mono text-[10px]">
              {includedRefs.length}
            </Badge>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-thin">
            {includedRefs.map((ref, idx) => {
              const isExtracted = state.extractions.some((e) => e.referenceId === ref.id)
              const isActive = idx === activeIndex

              return (
                <button
                  key={ref.id}
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all duration-300 group relative",
                    isActive
                      ? "bg-white border-[#6B8F71] shadow-md ring-1 ring-[#6B8F71]/20"
                      : "bg-[#FAF8F4]/50 border-[#E5E2DA] hover:border-[#6B8F71]/50 hover:bg-white"
                  )}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider font-mono">
                        {ref.year || "S/D"}
                      </span>
                      {isExtracted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#6B8F71]" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E5E2DA]" />
                      )}
                    </div>
                    <h4 className={cn(
                      "text-sm font-bold leading-snug line-clamp-2 transition-colors",
                      isActive ? "text-[#1C1C1E]" : "text-[#5F5E60] group-hover:text-[#1C1C1E]"
                    )}>
                      {ref.title}
                    </h4>
                    <p className="text-[10px] font-medium italic text-[#A1A1AA] truncate">
                      {ref.authors[0] || "Sem Autor"}{ref.authors.length > 1 ? " et al." : ""}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Detail Form: Extraction Data */}
        <main className="flex-1 overflow-hidden flex flex-col h-full min-h-[600px]">
          <ExtractionForm
            key={current.id}
            reference={current}
            extraction={state.extractions.find((e) => e.referenceId === current.id)}
            onSave={(data: Partial<Extraction>) => {
              upsertExtraction(current.id, data)
            }}
            onPrev={() => setActiveIndex((i) => Math.max(0, i - 1))}
            onNext={() => setActiveIndex((i) => Math.min(includedRefs.length - 1, i + 1))}
            hasPrev={activeIndex > 0}
            hasNext={activeIndex < includedRefs.length - 1}
            position={activeIndex + 1}
            total={includedRefs.length}
          />
        </main>
      </div>
    </div>
  )
}

function ExtractionForm({ reference, extraction, onSave, onPrev, onNext, hasPrev, hasNext, position, total }: any) {
  const [data, setData] = useState(
    extraction || {
      objective: "",
      participantsContext: "",
      educationalLevel: "",
      country: "",
      ageRange: "",
      participantsN: "",
      duration: "",
      methodology: "",
      instruments: [] as string[],
      toolPlatform: "",
      gamificationElements: [] as string[],
      gamificationFramework: "",
      gamificationType: "",
      keyFindings: "",
      motivationImpact: "",
      performanceImpact: "",
      theoreticalFramework: "",
      limitations: "",
      pedagogicalImplications: "",
      synthesisNotes: "",
      personalRelevance: "",
      qualityScore: 0,
    },
  )

  const [newInstrument, setNewInstrument] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    onSave(data)
    setTimeout(() => {
      setIsSaving(false)
      toast.success("Extração guardada com sucesso.")
    }, 800)
  }

  return (
    <Card className="flex flex-col h-full rounded-2xl border-[#E5E2DA] shadow-sm overflow-hidden bg-white">
      {/* Form Header */}
      <div className="p-6 border-b border-[#E5E2DA] bg-[#FAF8F4]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] bg-white px-2 py-0.5 rounded border border-[#E5E2DA]">
              ESTUDO {position} DE {total}
            </span>
            <span className="w-1 h-1 rounded-full bg-[#E5E2DA]" />
            <span className="text-[10px] font-bold text-[#6B8F71] uppercase tracking-widest">Aberto para análise</span>
          </div>
          <h2 className="font-serif text-xl font-bold text-[#1C1C1E] leading-tight line-clamp-1">{reference.title}</h2>
          <p className="text-xs text-[#5C5955] mt-1 font-medium italic">
            {reference.authors.join(", ")} ({reference.year})
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={onPrev} disabled={!hasPrev} className="rounded-lg h-9 w-9 p-0 border-[#E5E2DA]">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext} className="rounded-lg h-9 w-9 p-0 border-[#E5E2DA]">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Form Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <Tabs defaultValue="base" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-[#E5E2DA] rounded-none h-12 p-0 gap-6 mb-8">
            <TabTrigger value="base" icon={<Info className="w-3.5 h-3.5" />} label="Identificação" />
            <TabTrigger value="metodo" icon={<Microscope className="w-3.5 h-3.5" />} label="Metodologia" />
            <TabTrigger value="gamificacao" icon={<GraduationCap className="w-3.5 h-3.5" />} label="Domínio" />
            <TabTrigger value="resultados" icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Resultados" />
          </TabsList>

          <TabsContent value="base" className="space-y-8 animate-in fade-in-50 duration-500">
            <FormField label="Objetivo da Investigação" description="Qual o foco principal declarado pelos autores?">
              <Textarea
                value={data.objective}
                onChange={(e) => setData({ ...data, objective: e.target.value })}
                placeholder="Ex: Avaliar o impacto da gamificação no ensino de programação..."
                className="min-h-[100px] border-[#E5E2DA] rounded-xl focus-visible:ring-[#6B8F71]"
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField label="País / Contexto Geográfico">
                <Input
                  value={data.country}
                  onChange={(e) => setData({ ...data, country: e.target.value })}
                  placeholder="Ex: Brasil / Escola Pública"
                  className="border-[#E5E2DA] rounded-lg focus-visible:ring-[#6B8F71]"
                />
              </FormField>
              <FormField label="Nível de Ensino">
                <Input
                  value={data.educationalLevel}
                  onChange={(e) => setData({ ...data, educationalLevel: e.target.value })}
                  placeholder="Ex: Ensino Superior"
                  className="border-[#E5E2DA] rounded-lg focus-visible:ring-[#6B8F71]"
                />
              </FormField>
            </div>
          </TabsContent>

          <TabsContent value="metodo" className="space-y-8 animate-in fade-in-50 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <FormField label="Desenho Metodológico">
                 <Select value={data.methodology} onValueChange={v => setData({ ...data, methodology: v })}>
                   <SelectTrigger className="border-[#E5E2DA] rounded-lg h-10">
                     <SelectValue placeholder="Selecione o desenho" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Qualitativa">Qualitativa</SelectItem>
                     <SelectItem value="Quantitativa">Quantitativa</SelectItem>
                     <SelectItem value="Experimental">Experimental / ECR</SelectItem>
                     <SelectItem value="Quasi-experimental">Quasi-experimental</SelectItem>
                     <SelectItem value="Mista">Mista (Mixed Methods)</SelectItem>
                     <SelectItem value="Estudo de Caso">Estudo de Caso</SelectItem>
                   </SelectContent>
                 </Select>
               </FormField>
               <FormField label="Tamanho da Amostra (n)">
                 <Input
                   value={data.participantsN}
                   onChange={(e) => setData({ ...data, participantsN: e.target.value })}
                   placeholder="Ex: n = 120"
                   className="border-[#E5E2DA] rounded-lg"
                 />
               </FormField>
             </div>

             <FormField label="Instrumentos de Recolha">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newInstrument}
                    onChange={(e) => setNewInstrument(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        if (newInstrument.trim()) {
                          setData({ ...data, instruments: [...data.instruments, newInstrument.trim()] })
                          setNewInstrument("")
                        }
                      }
                    }}
                    placeholder="Adicionar instrumento (ex: Questionário Likert)..."
                    className="border-[#E5E2DA] rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg border-[#E5E2DA] hover:bg-[#6B8F71]/10 hover:text-[#6B8F71]"
                    onClick={() => {
                      if (newInstrument.trim()) {
                        setData({ ...data, instruments: [...data.instruments, newInstrument.trim()] })
                        setNewInstrument("")
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.instruments.map((t: string) => (
                    <Badge key={t} className="bg-[#FAF8F4] text-[#1C1C1E] border border-[#E5E2DA] hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer px-3 py-1 gap-2 transition-all" onClick={() => setData({ ...data, instruments: data.instruments.filter((x: string) => x !== t) })}>
                      {t} <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              </div>
            </FormField>
          </TabsContent>

          <TabsContent value="gamificacao" className="space-y-8 animate-in fade-in-50 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField label="Plataforma / Ferramenta">
                  <Input
                    value={data.toolPlatform}
                    onChange={(e) => setData({ ...data, toolPlatform: e.target.value })}
                    placeholder="Ex: Kahoot, Duolingo, Custom Made"
                    className="border-[#E5E2DA] rounded-lg"
                  />
                </FormField>
                <FormField label="Framework Teórico">
                  <Input
                    value={data.gamificationFramework}
                    onChange={(e) => setData({ ...data, gamificationFramework: e.target.value })}
                    placeholder="Ex: MDA, Octalysis, Self-Determination Theory"
                    className="border-[#E5E2DA] rounded-lg"
                  />
                </FormField>
             </div>
             <FormField label="Elementos de Gamificação">
               <Textarea
                 value={data.gamificationElements.join(", ")}
                 onChange={(e) => setData({ ...data, gamificationElements: e.target.value.split(",").map(s => s.trim()) })}
                 placeholder="Ex: Pontos, Leaderboards, Badges, Narrativa..."
                 className="min-h-[100px] border-[#E5E2DA] rounded-xl"
               />
             </FormField>
          </TabsContent>

          <TabsContent value="resultados" className="space-y-8 animate-in fade-in-50 duration-500">
             <FormField label="Resultados Principais">
               <Textarea
                 value={data.keyFindings}
                 onChange={(e) => setData({ ...data, keyFindings: e.target.value })}
                 placeholder="Descreva as conclusões mais relevantes..."
                 className="min-h-[150px] border-[#E5E2DA] rounded-xl"
               />
             </FormField>
             <FormField label="Notas de Síntese / Reflexão">
               <Textarea
                 value={data.synthesisNotes}
                 onChange={(e) => setData({ ...data, synthesisNotes: e.target.value })}
                 placeholder="Notas internas para a escrita do manuscrito..."
                 className="min-h-[100px] border-[#E5E2DA] rounded-xl bg-[#FAF8F4]/20"
               />
             </FormField>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Form Footer */}
      <div className="p-6 bg-[#FAF8F4]/30 border-t border-[#E5E2DA] flex justify-between items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-[#A1A1AA] text-xs">
          <Info className="w-3.5 h-3.5" />
          <span>Alterações são guardadas apenas ao clicar em Guardar.</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onPrev} disabled={!hasPrev} className="text-[#5F5E60] hover:text-[#1C1C1E] h-10 px-6 font-bold font-serif text-xs">
            Descartar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-[#1C1C1E] hover:bg-black text-white px-8 h-10 rounded-xl font-serif font-bold text-xs gap-2 shadow-lg shadow-black/10">
            {isSaving ? "A Guardar..." : <><Save className="w-3.5 h-3.5" /> Guardar Extração</>}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function TabTrigger({ value, icon, label }: { value: string, icon: React.ReactNode, label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#6B8F71] data-[state=active]:text-[#6B8F71] rounded-none px-2 h-full flex items-center gap-2 font-serif text-xs font-bold transition-all border-b-2 border-transparent text-[#A1A1AA] hover:text-[#5F5E60]"
    >
      {icon}
      {label}
    </TabsTrigger>
  )
}

function FormField({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col">
        <Label className="text-sm font-bold text-[#1C1C1E] mb-1">{label}</Label>
        {description && <p className="text-[10px] text-[#A1A1AA] font-medium leading-tight mb-2 uppercase tracking-tight">{description}</p>}
      </div>
      {children}
    </div>
  )
}
