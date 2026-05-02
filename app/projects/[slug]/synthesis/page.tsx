"use client"

import { useStore } from "@/lib/store"
import { PageHeader } from "@/components/litmap/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Tag, 
  Bold, 
  Italic, 
  List, 
  Quote, 
  Save, 
  Search, 
  MoreVertical, 
  ChevronRight, 
  History,
  Type,
  FileText,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Underline as UnderlineIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

export default function SynthesisPage() {
  const { state } = useStore()
  const [activeTheme, setActiveTheme] = useState<string | null>("Engagement")

  const themes = [
    { id: "1", name: "Engagement", color: "#6B8F71", count: 12 },
    { id: "2", name: "Aprendizagem", color: "#D4AC0D", count: 8 },
    { id: "3", name: "Motivação", color: "#8E44AD", count: 5 },
    { id: "4", name: "Metodologia", color: "#2980B9", count: 15 },
  ]

  const referencesCount = state.references.filter((r) => r.stage === "included").length

  return (
    <div className="flex flex-col h-full bg-[#FAF8F4]">
      <PageHeader
        title="Síntese & Escrita"
        subtitle="Construa a narrativa da sua revisão integrando os temas extraídos da literatura."
        actions={
          <Button className="bg-[#1C1C1E] hover:bg-black text-white px-6 h-10 rounded-lg font-serif font-bold text-xs gap-2 shadow-lg shadow-black/10">
            <Save className="w-4 h-4" /> Guardar Manuscrito
          </Button>
        }
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Sidebar: Theme Explorer */}
        <aside className="w-full lg:w-72 bg-white border-r border-[#E5E2DA] flex flex-col shrink-0">
          <div className="p-6 border-b border-[#E5E2DA]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-sm font-bold text-[#1C1C1E] uppercase tracking-widest flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#6B8F71]" />
                Temas & Tags
              </h2>
              <button className="text-[#A1A1AA] hover:text-[#1C1C1E] transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
              <Input 
                placeholder="Pesquisar temas..." 
                className="pl-9 h-8 text-xs border-[#E5E2DA] bg-[#FAF8F4] rounded-lg"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setActiveTheme(theme.name)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all duration-300 group flex items-center justify-between",
                  activeTheme === theme.name ? "bg-[#FAF8F4] border border-[#E5E2DA] shadow-sm" : "hover:bg-[#FAF8F4]/50"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: theme.color }} />
                  <span className={cn(
                    "text-xs font-bold truncate",
                    activeTheme === theme.name ? "text-[#1C1C1E]" : "text-[#5F5E60]"
                  )}>
                    {theme.name}
                  </span>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono border-[#E5E2DA] text-[#A1A1AA] group-hover:text-[#1C1C1E]">
                  {theme.count}
                </Badge>
              </button>
            ))}
          </div>

          <div className="p-4 bg-[#FAF8F4]/50 border-t border-[#E5E2DA]">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-2">
              <span>Progresso da Síntese</span>
              <span>45%</span>
            </div>
            <div className="w-full h-1 bg-[#E5E2DA] rounded-full overflow-hidden">
              <div className="h-full bg-[#6B8F71]" style={{ width: "45%" }} />
            </div>
          </div>
        </aside>

        {/* Editor Workspace */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          
          {/* Toolbar */}
          <div className="h-14 border-b border-[#E5E2DA] flex items-center px-6 justify-between shrink-0 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-1 sm:gap-2">
              <ToolbarButton icon={<Bold className="w-4 h-4" />} />
              <ToolbarButton icon={<Italic className="w-4 h-4" />} />
              <ToolbarButton icon={<UnderlineIcon className="w-4 h-4" />} />
              <div className="w-px h-6 bg-[#E5E2DA] mx-2" />
              <ToolbarButton icon={<AlignLeft className="w-4 h-4" />} />
              <ToolbarButton icon={<AlignCenter className="w-4 h-4" />} />
              <ToolbarButton icon={<AlignRight className="w-4 h-4" />} />
              <div className="w-px h-6 bg-[#E5E2DA] mx-2" />
              <ToolbarButton icon={<List className="w-4 h-4" />} />
              <ToolbarButton icon={<Quote className="w-4 h-4" />} />
            </div>

            <div className="hidden md:flex items-center gap-4">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FAF8F4] border border-[#E5E2DA] rounded-lg">
                <div className="w-2 h-2 rounded-full bg-[#6B8F71]" />
                <span className="text-[10px] font-bold text-[#1C1C1E] uppercase tracking-widest">Tag: {activeTheme}</span>
                <ChevronRight className="w-3 h-3 text-[#A1A1AA]" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#A1A1AA] font-mono">
                <History className="w-3.5 h-3.5" />
                <span>2 min atrás</span>
              </div>
            </div>
          </div>

          {/* Writing Canvas */}
          <div className="flex-1 overflow-y-auto p-8 lg:p-16 scrollbar-thin">
            <div className="max-w-[800px] mx-auto min-h-full flex flex-col">
              
              {/* Title Section */}
              <div className="mb-12">
                <input 
                  defaultValue="Análise da Gamificação na Educação em Engenharia"
                  className="w-full font-serif text-3xl lg:text-4xl font-bold text-[#1C1C1E] border-none focus:ring-0 placeholder:text-[#E5E2DA] bg-transparent p-0 leading-tight"
                  placeholder="Título do Manuscrito..."
                />
                <div className="h-1 w-20 bg-[#6B8F71] mt-6 rounded-full" />
              </div>

              {/* Editable Body */}
              <div 
                className="prose prose-stone max-w-none focus:outline-none font-serif text-lg text-[#1C1C1E] leading-relaxed selection:bg-[#6B8F71]/20"
                contentEditable
                suppressContentEditableWarning
              >
                <p>
                  A integração de elementos de gamificação no ensino superior de tecnologia tem demonstrado ser um motor fundamental para o aumento do engajamento e retenção de conhecimento. Tradicionalmente, o ensino de algoritmos é visto como árido e puramente abstrato, resultando em altas taxas de abandono.
                </p>
                <p>
                  Com base na análise sistemática de <strong>{referencesCount} estudos</strong> incluídos nesta revisão, observou-se que a aplicação de mecânicas de 
                  <mark className="bg-[#6B8F71]/15 text-[#2C4E34] px-1 rounded-sm border-b-2 border-[#6B8F71]/30 cursor-pointer hover:bg-[#6B8F71]/25 transition-all" title="Tema: Engagement">
                    feedback imediato e progressão visível
                  </mark>
                  é o fator determinante para a superação da curva inicial de aprendizagem. 
                </p>
                <blockquote className="border-l-4 border-[#6B8F71] pl-6 my-10 italic text-[#5F5E60] font-medium text-xl">
                  "A gamificação não deve ser vista como entretenimento, mas como uma estrutura de motivação extrínseca que prepara o terreno para a descoberta intrínseca."
                </blockquote>
                <p>
                  No entanto, a 
                  <mark className="bg-[#D4AC0D]/15 text-[#7D5A00] px-1 rounded-sm border-b-2 border-[#D4AC0D]/30 cursor-pointer hover:bg-[#D4AC0D]/25 transition-all" title="Tema: Aprendizagem">
                    calibração da dificuldade (Flow State)
                  </mark>
                  surge como o maior desafio prático. Se o sistema é demasiado simples, gera tédio; se demasiado complexo, gera ansiedade e abandono prematuro do ambiente virtual de aprendizagem.
                </p>
                <h3 className="text-2xl font-bold mt-12 mb-6">Implicações para o Design Instrucional</h3>
                <p>
                  Os dados sugerem que designers devem focar em narrativas que conectem o código a problemas reais (Context-Aware Learning), utilizando badges e tabelas de liderança como indicadores de progresso social e não apenas competitividade bruta.
                </p>
              </div>

              {/* Floating Action Hint */}
              <div className="mt-20 py-12 border-t border-[#FAF8F4] flex flex-col items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-[#FAF8F4] flex items-center justify-center text-[#E5E2DA]">
                   <Type className="w-5 h-5" />
                 </div>
                 <p className="text-xs font-bold text-[#A1A1AA] uppercase tracking-widest">Fim do Manuscrito Atual</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function ToolbarButton({ icon, active }: { icon: React.ReactNode, active?: boolean }) {
  return (
    <button className={cn(
      "p-2 rounded-lg transition-all duration-200 group",
      active ? "bg-[#1C1C1E] text-white" : "text-[#5F5E60] hover:bg-[#FAF8F4] hover:text-[#1C1C1E]"
    )}>
      {icon}
    </button>
  )
}
