"use client"

import { useStore } from "@/lib/store"
import { useMemo } from "react"
import { toPng } from "html-to-image"
import { PageHeader } from "@/components/litmap/page-header"
import { Button } from "@/components/ui/button"
import { Download, Info, FileText, CheckCircle2, AlertTriangle, Database } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function PrismaPage() {
  const { state } = useStore()
  const project = state.project

  const stats = useMemo(() => {
    const refs = state.references
    if (!project || refs.length === 0) return {
      dbCounts: {} as Record<string, number>, totalIdentified: 0,
      duplicates: 0, retracted: 0, booksTheses: 0, secondaryStudies: 0,
      screened: 0, excludedByTitleAbstract: 0, soughtRetrieval: 0,
      notRetrieved: 0, assessed: 0, excludedEligibility: 0,
      eligibilityExclusionReasons: {} as Record<string, number>, included: 0,
    }
    const dbCounts: Record<string, number> = {}
    refs.forEach(r => { if (r.database) dbCounts[r.database] = (dbCounts[r.database] || 0) + 1 })
    const totalIdentified = refs.length
    const duplicates = refs.filter(r => r.stage === "excluded" && r.exclusionCategory === "Duplicado").length
    const retracted = refs.filter(r => r.stage === "excluded" && r.exclusionCategory === "Artigo Retratado").length
    const booksTheses = refs.filter(r => r.stage === "excluded" && ["Capítulo de Livro", "Livro", "Tese/Dissertação", "Relatório/Técnico"].includes(r.exclusionCategory || "")).length
    const secondaryStudies = refs.filter(r => r.stage === "excluded" && r.exclusionCategory === "Tipo de Publicação").length
    const screened = totalIdentified - duplicates - retracted - booksTheses - secondaryStudies
    const excludedByTitleAbstract = refs.filter(r => r.stage === "excluded" && ["Remoção por Título", "Remoção por Resumo/Abstract", "Idioma", "Período"].includes(r.exclusionCategory || "")).length
    const soughtRetrieval = screened - excludedByTitleAbstract
    const notRetrieved = refs.filter(r => r.stage === "excluded" && r.exclusionCategory === "Sem Texto Completo").length
    const assessed = soughtRetrieval - notRetrieved
    const eligibilityExcluded = refs.filter(r => r.stage === "excluded" && ["Critério de Inclusão", "Metodologia", "População", "Outro"].includes(r.exclusionCategory || ""))
    const excludedEligibility = eligibilityExcluded.length
    const eligibilityExclusionReasons: Record<string, number> = {}
    eligibilityExcluded.forEach(r => { const k = r.exclusionCategory || "Outro"; eligibilityExclusionReasons[k] = (eligibilityExclusionReasons[k] || 0) + 1 })
    const included = refs.filter(r => r.stage === "included").length
    return { dbCounts, totalIdentified, duplicates, retracted, booksTheses, secondaryStudies, screened, excludedByTitleAbstract, soughtRetrieval, notRetrieved, assessed, excludedEligibility, eligibilityExclusionReasons, included }
  }, [project, state.references])

  if (!project) return null

  const handleDownloadPng = async () => {
    const node = document.getElementById("prisma-canvas")
    if (!node) return

    toast.promise(
      (async () => {
        const dataUrl = await toPng(node, { cacheBust: true, backgroundColor: "#FAF8F4", pixelRatio: 3 })
        const a = document.createElement("a")
        a.download = `prisma-${project.slug}.png`
        a.href = dataUrl
        a.click()
      })(),
      {
        loading: "A gerar imagem de alta resolução...",
        success: "Fluxograma PRISMA exportado com sucesso!",
        error: "Erro ao exportar imagem."
      }
    )
  }

  // ── Primitives ────────────────────────────────────────────────────────────

  const VConn = ({ h = 40 }: { h?: number }) => (
    <div className="flex justify-center" style={{ height: h }}>
      <div className="w-[1.5px] bg-[#1C1C1E]" style={{ height: h }} />
    </div>
  )

  const HArrow = () => (
    <div className="flex items-center shrink-0" style={{ width: 52 }}>
      <div className="flex-1 h-[1.5px] bg-[#1C1C1E]" />
      <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "8px solid #1C1C1E" }} />
    </div>
  )

  const MainBox = ({ children }: { children: React.ReactNode }) => (
    <div className="border-[1.5px] border-[#1C1C1E] bg-white p-4 flex-1 shadow-sm rounded-sm">
      {children}
    </div>
  )

  const ExcBox = ({ children }: { children: React.ReactNode }) => (
    <div className="border-[1.5px] border-[#1C1C1E] bg-[#FAF8F4] p-4 flex-1 shadow-sm rounded-sm">
      {children}
    </div>
  )

  const IncBox = ({ children }: { children: React.ReactNode }) => (
    <div className="border-[2.5px] border-[#6B8F71] bg-[#6B8F71]/5 p-6 flex-1 shadow-md rounded-sm">
      {children}
    </div>
  )

  const label = (text: string) => (
    <span className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[11px] font-bold tracking-[0.2em] uppercase text-[#A1A1AA]">
      {text}
    </span>
  )

  return (
    <div className="flex flex-col min-h-full bg-[#FAF8F4]">
      <PageHeader
        title="Relatório PRISMA"
        subtitle="Fluxograma oficial PRISMA 2020 gerado automaticamente a partir dos dados do projeto."
        actions={
          <Button onClick={handleDownloadPng} className="bg-[#1C1C1E] hover:bg-black text-white px-6 h-10 rounded-lg font-serif font-bold text-xs gap-2 shadow-lg shadow-black/10">
            <Download className="w-4 h-4" /> Exportar PNG
          </Button>
        }
      />

      <div className="p-4 lg:p-8 space-y-8">

        {/* Canvas Area with horizontal scroll for mobile */}
        <div className="overflow-x-auto pb-4 scrollbar-thin">
          <div id="prisma-canvas" className="bg-white rounded-2xl p-16 border border-[#E5E2DA] shadow-sm min-w-[900px] flex flex-col items-center">

            <div className="w-full max-w-[820px] font-serif text-[13px]">

              {/* Header Title inside Canvas for export */}
              <div className="mb-12 border-b-2 border-[#1C1C1E] pb-4 flex justify-between items-end">
                <h1 className="text-2xl font-bold uppercase tracking-tight">PRISMA 2020 Flow Diagram</h1>
                <div className="text-[10px] font-mono font-bold text-[#A1A1AA] uppercase">Project: {project.title}</div>
              </div>

              {/* ── SECTION 1: Identification ─────────────────────────────── */}
              <div className="flex">
                <div className="w-16 shrink-0 border-r-2 border-[#E5E2DA] flex items-center justify-center py-4">
                  {label("Identificação")}
                </div>
                <div className="flex-1 pl-8 pt-4">
                  <div className="flex gap-8">
                    <MainBox>
                      <div className="font-bold mb-2 uppercase text-[11px] tracking-wider">Registos identificados nas bases de dados</div>
                      <div className="text-lg font-bold text-[#6B8F71] font-mono">(n = {stats.totalIdentified})</div>
                      <ul className="mt-4 space-y-1 text-xs text-[#5F5E60] font-medium border-t border-[#E5E2DA] pt-3">
                        {Object.entries(stats.dbCounts).map(([db, n]) => <li key={db}>{db}: <strong>{n}</strong></li>)}
                        {Object.keys(stats.dbCounts).length === 0 && <li className="italic text-[#A1A1AA]">Nenhum registo</li>}
                      </ul>
                    </MainBox>
                    <ExcBox>
                      <div className="font-bold mb-2 uppercase text-[11px] tracking-wider">Registos removidos antes da triagem:</div>
                      <ul className="space-y-1.5 text-xs text-[#5F5E60] font-medium">
                        <li className="flex justify-between">Duplicados: <span>n = {stats.duplicates}</span></li>
                        <li className="flex justify-between">Retratados: <span>n = {stats.retracted}</span></li>
                        <li className="flex justify-between">Livros / Teses: <span>n = {stats.booksTheses}</span></li>
                        <li className="flex justify-between">Estudos secundários: <span>n = {stats.secondaryStudies}</span></li>
                      </ul>
                    </ExcBox>
                  </div>
                  <div className="w-1/2">
                    <VConn h={40} />
                  </div>
                </div>
              </div>

              {/* ── SECTION 2: Screening ───────────────── */}
              <div className="flex">
                <div className="w-16 shrink-0 border-r-2 border-[#E5E2DA] flex items-center justify-center">
                  {label("Triagem")}
                </div>
                <div className="flex-1 pl-8 flex flex-col">
                  {/* Screened row */}
                  <div className="flex items-center">
                    <MainBox>
                      <div className="font-bold mb-2 uppercase text-[11px] tracking-wider">Registos Triados (Título/Resumo)</div>
                      <div className="text-lg font-bold text-[#6B8F71] font-mono">(n = {stats.screened})</div>
                    </MainBox>
                    <HArrow />
                    <ExcBox>
                      <div className="font-bold mb-2 uppercase text-[11px] tracking-wider text-[#BA1A1A]">Registos excluídos</div>
                      <div className="text-lg font-bold text-[#BA1A1A] font-mono">(n = {stats.excludedByTitleAbstract})</div>
                    </ExcBox>
                  </div>
                  <div className="flex">
                    <div className="flex-1 flex justify-center"><VConn h={40} /></div>
                    <div className="w-[52px]" />
                    <div className="flex-1" />
                  </div>
                  {/* Retrieval row */}
                  <div className="flex items-center">
                    <MainBox>
                      <div className="font-bold mb-2 uppercase text-[11px] tracking-wider">Relatórios procurados para recuperação</div>
                      <div className="text-lg font-bold text-[#6B8F71] font-mono">(n = {stats.soughtRetrieval})</div>
                    </MainBox>
                    <HArrow />
                    <ExcBox>
                      <div className="font-bold mb-2 uppercase text-[11px] tracking-wider text-[#BA1A1A]">Relatórios não recuperados</div>
                      <div className="text-lg font-bold text-[#BA1A1A] font-mono">(n = {stats.notRetrieved})</div>
                    </ExcBox>
                  </div>
                  <div className="flex">
                    <div className="flex-1 flex justify-center"><VConn h={40} /></div>
                    <div className="w-[52px]" />
                    <div className="flex-1" />
                  </div>
                </div>
              </div>

              {/* ── SECTION 3: Eligibility ─────────────────────────────── */}
              <div className="flex">
                <div className="w-16 shrink-0 border-r-2 border-[#E5E2DA] flex items-center justify-center">
                  {label("Elegibilidade")}
                </div>
                <div className="flex-1 pl-8">
                  <div className="flex items-center">
                    <MainBox>
                      <div className="font-bold mb-2 uppercase text-[11px] tracking-wider">Relatórios avaliados para elegibilidade</div>
                      <div className="text-lg font-bold text-[#6B8F71] font-mono">(n = {stats.assessed})</div>
                    </MainBox>
                    <HArrow />
                    <ExcBox>
                      <div className="font-bold mb-2 uppercase text-[11px] tracking-wider text-[#BA1A1A]">Relatórios excluídos:</div>
                      <div className="space-y-1 mt-2">
                        {Object.keys(stats.eligibilityExclusionReasons).length > 0
                          ? Object.entries(stats.eligibilityExclusionReasons).map(([r, n]) => (
                            <div key={r} className="text-xs flex justify-between">
                              <span className="font-medium text-[#5F5E60]">{r}:</span>
                              <span className="font-mono">n = {n}</span>
                            </div>
                          ))
                          : <div className="font-mono text-[#BA1A1A]">n = {stats.excludedEligibility}</div>
                        }
                      </div>
                    </ExcBox>
                  </div>
                  <div className="w-1/2">
                    <VConn h={40} />
                  </div>
                </div>
              </div>

              {/* ── SECTION 4: Inclusion ──────────────────────────────────── */}
              <div className="flex">
                <div className="w-16 shrink-0 border-r-2 border-[#E5E2DA] flex items-center justify-center py-4">
                  {label("Inclusão")}
                </div>
                <div className="flex-1 pl-8 pb-8 flex gap-8">
                  <IncBox>
                    <div className="font-bold text-sm uppercase tracking-[0.1em] text-[#1C1C1E] mb-2">Estudos incluídos na síntese final</div>
                    <div className="text-4xl font-bold text-[#6B8F71] font-mono tracking-tighter">N = {stats.included}</div>
                  </IncBox>
                  <div className="flex-1" />
                </div>
              </div>

              {/* Footer Citation */}
              <div className="mt-8 pt-6 border-t border-[#E5E2DA] text-[10px] text-[#A1A1AA] italic leading-relaxed">
                Adapted from: Page MJ, McKenzie JE, Bossuyt PM, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. BMJ 2021;372:n71. <br />
                Generated automatically by LitMap Systematic Review Tool.
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          <div className="bg-white rounded-xl border border-[#E5E2DA] p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-[#1C1C1E] mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#6B8F71]" />
              Resumo Final
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-[#5F5E60] uppercase tracking-wider">Total Identificado</span>
                <span className="text-xl font-mono font-bold">{stats.totalIdentified}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-[#BA1A1A] uppercase tracking-wider">Total Excluído</span>
                <span className="text-xl font-mono font-bold">{stats.totalIdentified - stats.included}</span>
              </div>
              <div className="h-px bg-[#E5E2DA]" />
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-[#6B8F71] uppercase tracking-widest">Incluídos Final</span>
                <span className="text-3xl font-mono font-bold text-[#6B8F71]">{stats.included}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E2DA] p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-[#1C1C1E] mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#BA1A1A]" />
              Motivos de Exclusão
            </h3>
            <div className="space-y-2">
               <StatRow label="Duplicados" value={stats.duplicates} />
               <StatRow label="Triagem (Título/Resumo)" value={stats.excludedByTitleAbstract} />
               <StatRow label="Elegibilidade (Texto)" value={stats.excludedEligibility} />
               <StatRow label="Não Recuperados" value={stats.notRetrieved} />
               <StatRow label="Outros Critérios" value={stats.booksTheses + stats.retracted + stats.secondaryStudies} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E2DA] p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-[#1C1C1E] mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Cobertura de Fontes
            </h3>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin">
              {Object.entries(stats.dbCounts).map(([db, n]) => (
                <div key={db} className="flex justify-between items-center text-xs">
                  <span className="font-medium text-[#5F5E60]">{db}</span>
                  <Badge variant="secondary" className="font-mono bg-[#FAF8F4]">{n}</Badge>
                </div>
              ))}
              {Object.keys(stats.dbCounts).length === 0 && <p className="text-xs italic text-[#A1A1AA]">Sem fontes registadas.</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function StatRow({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="font-medium text-[#5F5E60]">{label}</span>
      <span className="font-mono font-bold text-[#1C1C1E]">{value}</span>
    </div>
  )
}
