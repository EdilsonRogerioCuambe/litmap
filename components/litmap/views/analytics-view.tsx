"use client"

import { useStore } from "@/lib/store"
import { useParams } from "next/navigation"
import { PageHeader } from "../page-header"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { FileText, Filter, TrendingUp, PieChart as PieChartIcon, BarChart3, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMemo, useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const COLORS = ['#6B8F71', '#C4914A', '#5C5955', '#3A6FA8', '#BA1A1A', '#8B5CF6']

export function AnalyticsView() {
  const { state } = useStore()
  const params = useParams()
  const slug = params.slug as string
  const currentProject = state.project

  const [dataSource, setDataSource] = useState<"all" | "included">("all")

  // Process data for analytics
  const stats = useMemo(() => {
    if (!currentProject) return null

    const allRefs = state.references
    const refs = dataSource === "included" ? allRefs.filter(r => r.stage === "included") : allRefs
    
    const total = refs.length
    const totalAll = allRefs.length
    
    // Distribution by stage
    const stages = {
      identification: allRefs.filter(r => r.stage === "identification").length,
      screening: allRefs.filter(r => r.stage === "screening").length,
      eligibility: allRefs.filter(r => r.stage === "eligibility").length,
      included: allRefs.filter(r => r.stage === "included").length,
      excluded: allRefs.filter(r => r.stage === "excluded").length,
    }

    // Evolution by year
    const yearCounts: Record<number, number> = {}
    refs.forEach(r => {
      if (r.year) {
        yearCounts[r.year] = (yearCounts[r.year] || 0) + 1
      }
    })
    const years = Object.keys(yearCounts).map(Number).sort((a, b) => a - b)
    const yearData = years.map(y => ({ name: String(y), count: yearCounts[y] }))

    // Distribution by database
    const dbCounts: Record<string, number> = {}
    refs.forEach(r => {
      const db = r.database || "Desconhecida"
      dbCounts[db] = (dbCounts[db] || 0) + 1
    })
    const dbData = Object.entries(dbCounts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)

    // Exclusions
    const exclusionCounts: Record<string, number> = {}
    allRefs.filter(r => r.stage === "excluded").forEach(r => {
      const reason = r.exclusionCategory || "Sem Motivo"
      exclusionCounts[reason] = (exclusionCounts[reason] || 0) + 1
    })
    const exclusionData = Object.entries(exclusionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5

    // Quality Average
    const qualitySum = refs.reduce((acc, r) => acc + (r.qualityScore || 0), 0)
    const qualityCount = refs.filter(r => r.qualityScore && r.qualityScore > 0).length
    const qualityAvg = qualityCount > 0 ? (qualitySum / qualityCount).toFixed(1) : "0.0"

    return {
      total,
      totalAll,
      stages,
      yearData,
      dbData,
      exclusionData,
      qualityAvg,
      yearsRange: years.length > 0 ? `${years[0]} - ${years[years.length - 1]}` : "N/A"
    }
  }, [currentProject, state.references, dataSource])

  if (!currentProject || !stats) return null

  return (
    <div className="flex flex-col min-h-full bg-[#FAF8F4]">
      <PageHeader
        title="Resumo Geral do Mapeamento"
        subtitle={`Dashboard analítica e de progresso: ${currentProject.title}`}
        actions={
          <div className="flex gap-4 items-center">
            <Button onClick={() => window.location.href = `/projects/${slug}/report`} className="bg-[#1C1C1E] text-white hover:bg-black gap-2 h-9 px-4 rounded-lg shadow-sm">
              <FileText className="w-4 h-4" />
              Relatório em Texto
            </Button>
            <div className="flex bg-white rounded-lg border border-[#E5E2DA] p-1 shadow-sm">
               <ToggleGroup type="single" value={dataSource} onValueChange={(v) => v && setDataSource(v as "all" | "included")}>
                  <ToggleGroupItem value="all" className="h-8 text-xs font-bold px-4 data-[state=on]:bg-[#1C1C1E] data-[state=on]:text-white">Todas Referências</ToggleGroupItem>
                  <ToggleGroupItem value="included" className="h-8 text-xs font-bold px-4 data-[state=on]:bg-[#6B8F71] data-[state=on]:text-white">Apenas Incluídos</ToggleGroupItem>
               </ToggleGroup>
            </div>
          </div>
        }
      />

      <div className="p-4 lg:p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title={dataSource === "all" ? "Total de Artigos" : "Artigos Incluídos"} 
            value={stats.total.toLocaleString()} 
            icon={<FileText className="w-5 h-5 text-[#6B8F71]" />}
          />
          <StatCard 
            title="Taxa de Inclusão" 
            value={`${((stats.stages.included / (stats.totalAll || 1)) * 100).toFixed(1)}%`} 
            icon={<Filter className="w-5 h-5 text-[#3A6FA8]" />}
            subtitle={`${stats.stages.included} incluídos de ${stats.totalAll} totais`}
          />
          <StatCard 
            title="Score de Qualidade" 
            value={stats.qualityAvg} 
            icon={<TrendingUp className="w-5 h-5 text-[#C4914A]" />}
            subtitle="Média dos artigos avaliados"
          />
          <StatCard 
            title="Bases de Dados" 
            value={stats.dbData.length.toString()} 
            icon={<PieChartIcon className="w-5 h-5 text-[#8B5CF6]" />}
            subtitle="Fontes distintas"
          />
        </div>

        {/* PRISMA Funnel */}
        <div className="bg-white border border-[#E5E2DA] p-6 lg:p-8 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-[#FAF8F4] rounded-lg">
               <BarChart3 className="w-5 h-5 text-[#1C1C1E]" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1C1C1E]">Funil PRISMA</h3>
              <p className="text-xs text-[#A1A1AA] mt-1">Evolução dos artigos pelas fases de seleção</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative">
             <PrismaStep 
               label="Identificação" 
               count={stats.stages.identification} 
               percentage={100}
               color="bg-[#FAF8F4] border border-[#E5E2DA]" 
               textColor="text-[#5F5E60]" 
             />
             <StepConnector />
             <PrismaStep 
               label="Triagem" 
               count={stats.stages.screening} 
               percentage={stats.stages.identification > 0 ? (stats.stages.screening / stats.stages.identification) * 100 : 0}
               color="bg-[#E6F0F9] border border-[#B3D4F0]" 
               textColor="text-[#3A6FA8]" 
             />
             <StepConnector />
             <PrismaStep 
               label="Elegibilidade" 
               count={stats.stages.eligibility} 
               percentage={stats.stages.identification > 0 ? (stats.stages.eligibility / stats.stages.identification) * 100 : 0}
               color="bg-[#F3E8FF] border border-[#D8B4FE]" 
               textColor="text-[#8B5CF6]" 
             />
             <StepConnector />
             <PrismaStep 
               label="Incluídos" 
               count={stats.stages.included} 
               percentage={stats.stages.identification > 0 ? (stats.stages.included / stats.stages.identification) * 100 : 0}
               color="bg-[#EAF1ED] border border-[#B5CDBE]" 
               textColor="text-[#6B8F71]" 
               isFinal 
             />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Timeline Chart */}
          <div className="bg-white border border-[#E5E2DA] p-6 lg:p-8 rounded-2xl shadow-sm">
            <h3 className="font-serif text-lg font-bold text-[#1C1C1E] mb-6">Publicações por Ano</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.yearData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E2DA" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: '#FAF8F4' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E2DA', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#1C1C1E" radius={[4, 4, 0, 0]} name="Artigos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Databases Pie Chart */}
          <div className="bg-white border border-[#E5E2DA] p-6 lg:p-8 rounded-2xl shadow-sm">
            <h3 className="font-serif text-lg font-bold text-[#1C1C1E] mb-6">Fontes de Dados</h3>
            <div className="h-72 flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={stats.dbData}
                     cx="50%"
                     cy="50%"
                     innerRadius={70}
                     outerRadius={100}
                     paddingAngle={2}
                     dataKey="value"
                   >
                     {stats.dbData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <RechartsTooltip 
                     contentStyle={{ borderRadius: '8px', border: '1px solid #E5E2DA', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
               {stats.dbData.map((entry, index) => (
                 <div key={index} className="flex items-center gap-2">
                   <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                   <span className="text-[11px] font-bold text-[#5F5E60]">{entry.name} ({entry.value})</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Exclusion Reasons */}
        <div className="bg-white border border-[#E5E2DA] p-6 lg:p-8 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-[#BA1A1A]" />
            <h3 className="font-serif text-lg font-bold text-[#1C1C1E]">Principais Motivos de Exclusão</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={stats.exclusionData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E2DA" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11, fill: '#5F5E60', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                    cursor={{ fill: '#FAF8F4' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E2DA', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                <Bar dataKey="count" fill="#BA1A1A" radius={[0, 4, 4, 0]} name="Artigos Rejeitados" barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({ title, value, icon, subtitle }: { title: string, value: string, icon: React.ReactNode, subtitle?: string }) {
  return (
    <div className="bg-white border border-[#E5E2DA] p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-[#FAF8F4] rounded-xl border border-[#E5E2DA]">{icon}</div>
      </div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-1">{title}</p>
      <h4 className="font-serif text-3xl font-bold text-[#1C1C1E]">{value}</h4>
      {subtitle && <p className="text-xs text-[#5F5E60] mt-2 font-medium">{subtitle}</p>}
    </div>
  )
}

function PrismaStep({ label, count, percentage, color, textColor, isFinal = false }: { label: string, count: number, percentage: number, color: string, textColor: string, isFinal?: boolean }) {
  return (
    <div className={cn("px-6 py-5 rounded-2xl flex flex-col items-center min-w-[160px] text-center shadow-sm relative z-10", color)}>
      <span className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", textColor)}>{label}</span>
      <span className={cn("text-3xl font-serif font-bold", textColor)}>{count}</span>
      <span className={cn("text-[11px] font-bold mt-1 opacity-70", textColor)}>{percentage.toFixed(1)}%</span>
      {isFinal && <div className="absolute -inset-1 border-2 border-[#6B8F71]/30 rounded-[1.25rem] -z-10" />}
    </div>
  )
}

function StepConnector() {
  return (
    <div className="hidden md:block h-0.5 flex-1 bg-[#E5E2DA] relative">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-[#A1A1AA]" />
    </div>
  )
}
