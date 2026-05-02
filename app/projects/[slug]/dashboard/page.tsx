"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import { StageBadge } from "@/components/litmap/page-header"
import { AddReferenceModal, ReferenceDetailModal } from "@/components/litmap/reference-modal"
import type { Reference } from "@/lib/types"
import { STAGE_COLORS, STAGE_LABELS } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Plus, Lightbulb, ArrowRight, Activity, Database, Calendar, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { state } = useStore()
  const router = useRouter()
  const [openAdd, setOpenAdd] = useState(false)
  const [detailRef, setDetailRef] = useState<Reference | null>(null)

  const refs = state.references
  const project = state.project!

  const counts = useMemo(() => {
    const c = {
      total: refs.length,
      identification: 0,
      screening: 0,
      eligibility: 0,
      included: 0,
      excluded: 0,
    }
    refs.forEach((r) => {
      c[r.stage]++
    })
    return c
  }, [refs])

  const toReview = counts.identification + counts.screening + counts.eligibility

  const recent = useMemo(() => {
    return [...refs]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 8)
  }, [refs])

  const noExtractionForIncluded = useMemo(() => {
    const includedIds = refs.filter((r) => r.stage === "included").map((r) => r.id)
    const withExtraction = new Set(state.extractions.map((e) => e.referenceId))
    return includedIds.filter((id) => !withExtraction.has(id)).length
  }, [refs, state.extractions])

  return (
    <div className="flex-1 min-h-full p-4 lg:p-8 bg-[#FAF8F4]">
      <div className="max-w-[1400px] mx-auto space-y-6 lg:space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E2DA] pb-8">
          <div>
            <div className="flex items-center gap-2 text-[#5c7e6b] mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Painel de Controlo</span>
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl font-bold text-[#1C1C1E]">Visão Geral</h1>
            <p className="text-[#5C5955] text-sm lg:text-base mt-1">Estado atual da sua investigação e próximas etapas.</p>
          </div>
          <button 
            onClick={() => setOpenAdd(true)}
            className="bg-[#1C1C1E] text-white px-6 py-3 rounded-lg font-serif font-semibold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md shadow-black/10"
          >
            <Plus className="w-4 h-4" />
            Adicionar Artigo
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard label="Total Bibliográfico" value={counts.total} color="#1C1C1E" />
          <StatCard label="Incluídos (Included)" value={counts.included} color="#6B8F71" />
          <StatCard label="Excluídos (Excluded)" value={counts.excluded} color="#ba1a1a" />
          <StatCard label="Pendente de Revisão" value={toReview} color="#2980B9" />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Main Activity Column */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            
            {/* PRISMA Funnel */}
            <Card>
              <div className="mb-6">
                <h2 className="font-serif text-xl font-bold text-[#1C1C1E] mb-1">Fluxo de Triagem</h2>
                <p className="text-xs text-[#5C5955] font-mono uppercase tracking-wider">Distribuição por fase do protocolo PRISMA.</p>
              </div>
              <div className="space-y-5">
                {(["identification", "screening", "eligibility", "included", "excluded"] as const).map(
                  (stage) => {
                    const count = counts[stage]
                    const pct = counts.total ? Math.round((count / counts.total) * 100) : 0
                    const sc = STAGE_COLORS[stage]
                    return (
                      <div key={stage} className="space-y-1.5">
                        <div className="flex justify-between items-end">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1C1C1E]/70">
                            {STAGE_LABELS[stage]}
                          </span>
                          <span className="text-xs font-mono font-bold">
                            {count} <span className="text-[#A1A1AA] font-normal ml-1">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-[#FAF8F4] rounded-full overflow-hidden border border-[#E5E2DA]">
                          <div
                            className="h-full transition-all duration-700 ease-out rounded-full"
                            style={{ width: `${pct}%`, background: sc.border }}
                          />
                        </div>
                      </div>
                    )
                  },
                )}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#1C1C1E] mb-1">Artigos Recentes</h2>
                  <p className="text-xs text-[#5C5955] font-mono uppercase tracking-wider">Últimas alterações efetuadas.</p>
                </div>
                <button
                  onClick={() => router.push(`/projects/${project.slug}/references`)}
                  className="text-xs font-bold text-[#5c7e6b] hover:underline flex items-center gap-1"
                >
                  Ver Biblioteca <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              
              {recent.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-[#E5E2DA] rounded-xl text-[#A1A1AA] text-sm">
                  Nenhuma atividade registada.
                </div>
              ) : (
                <div className="divide-y divide-[#E5E2DA]">
                  {recent.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setDetailRef(r)}
                      className="group flex items-center justify-between py-4 hover:bg-[#FAF8F4] -mx-4 px-4 rounded-lg cursor-pointer transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-[#1C1C1E] leading-snug group-hover:text-[#5c7e6b] transition-colors line-clamp-1">{r.title}</h4>
                        <div className="text-[11px] text-[#5C5955] mt-1 flex items-center gap-2 truncate">
                          <span className="font-medium text-[#1C1C1E]/60 truncate">{r.authors.join(", ") || "Sem autores"}</span>
                          {r.year && <span className="w-1 h-1 rounded-full bg-[#E5E2DA]" />}
                          {r.year && <span>{r.year}</span>}
                        </div>
                      </div>
                      <div className="ml-4 shrink-0 scale-90 origin-right">
                        <StageBadge stage={r.stage} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar Info Column */}
          <div className="lg:col-span-4 space-y-6 lg:space-y-8">
            
            {/* Project Summary */}
            <Card className="bg-[#1C1C1E] text-white border-none shadow-xl shadow-black/10">
              <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#6B8F71]" />
                Escopo do Projeto
              </h2>
              <div className="space-y-5">
                <div>
                  <span className="text-[10px] font-bold text-[#6B8F71] uppercase tracking-widest block mb-1">Pergunta de Investigação</span>
                  <p className="text-sm text-gray-300 leading-relaxed italic line-clamp-4">
                    "{project.researchQuestion}"
                  </p>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <span className="text-[10px] font-bold text-[#6B8F71] uppercase tracking-widest block mb-2">Bases Indexadas</span>
                  <div className="flex flex-wrap gap-1.5">
                    {project.databases.map(db => (
                      <span key={db} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-gray-300">
                        {db}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-[#6B8F71] uppercase tracking-widest block mb-1">Período</span>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3 h-3" />
                      {project.yearFrom || "N/A"} — {project.yearTo || "N/A"}
                    </div>
                  </div>
                  <button 
                    onClick={() => router.push(`/projects/${project.slug}/settings`)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 text-[#6B8F71]" />
                  </button>
                </div>
              </div>
            </Card>

            {/* AI Insights / Tips */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-[#D4AC0D]" />
                <h2 className="font-serif text-lg font-bold text-[#1C1C1E]">Sugestões do LitMap</h2>
              </div>
              <div className="space-y-3">
                {counts.total === 0 ? (
                  <InsightItem tone="info" message="O seu projeto está vazio. Comece por importar ficheiros RIS ou BibTeX." />
                ) : null}
                
                {noExtractionForIncluded > 0 ? (
                  <InsightItem tone="warn" message={`Tens ${noExtractionForIncluded} artigos incluídos que ainda necessitam de extração de dados.`} />
                ) : null}

                {counts.total > 0 && toReview > 0 ? (
                  <InsightItem tone="info" message={`Ainda restam ${toReview} artigos para triagem inicial.`} />
                ) : null}

                {counts.included > 0 && state.themes.length === 0 ? (
                  <InsightItem tone="info" message="Dica: Crie temas na aba Síntese para categorizar os resultados encontrados." />
                ) : null}

                <div className="pt-4 mt-2 border-t border-[#E5E2DA]">
                  <button className="w-full py-2 text-xs font-bold text-[#5C5955] hover:text-[#1C1C1E] transition-colors flex items-center justify-center gap-2">
                    <Search className="w-3 h-3" />
                    Pesquisa Inteligente (Beta)
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <AddReferenceModal open={openAdd} onOpenChange={setOpenAdd} />
      <ReferenceDetailModal
        reference={detailRef}
        open={!!detailRef}
        onOpenChange={(o) => !o && setDetailRef(null)}
      />
    </div>
  )
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("bg-white border border-[#E5E2DA] rounded-xl shadow-sm p-6", className)}>
      {children}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white border border-[#E5E2DA] rounded-xl shadow-sm p-6 relative overflow-hidden group hover:border-[#6B8F71]/50 transition-all">
      <div className="absolute left-0 top-0 bottom-0 w-1 group-hover:w-1.5 transition-all" style={{ backgroundColor: color }} />
      <div className="font-serif text-4xl lg:text-5xl font-bold text-[#1C1C1E] tracking-tight">{value}</div>
      <div className="text-[10px] font-bold text-[#A1A1AA] mt-2 uppercase tracking-widest">{label}</div>
    </div>
  )
}

function InsightItem({ message, tone }: { message: string, tone: "info" | "warn" | "success" }) {
  const colors = {
    info: "bg-blue-50 text-blue-700 border-blue-100",
    warn: "bg-amber-50 text-amber-700 border-amber-100",
    success: "bg-green-50 text-green-700 border-green-100"
  }
  return (
    <div className={cn("px-3 py-2.5 rounded-lg text-xs leading-relaxed border", colors[tone])}>
      {message}
    </div>
  )
}
