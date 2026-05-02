"use client"

import { useMemo, useRef } from "react"
import { useStore } from "@/lib/store"
import { PageHeader } from "@/components/litmap/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function PrismaView() {
  const { state } = useStore()
  const project = state.project
  const flowRef = useRef<HTMLDivElement>(null)

  const stats = useMemo(() => {
    if (!project) {
      return {
        identified: 0,
        duplicates: 0,
        screened: 0,
        excludedScreening: 0,
        soughtRetrieval: 0,
        notRetrieved: 0,
        assessed: 0,
        excludedEligibility: 0,
        included: 0,
        screeningReasons: {} as Record<string, number>,
        excludedReasons: {} as Record<string, number>,
      }
    }
    const refs = state.references
    const totalRaw = refs.length
    const duplicates = refs.filter((r) => r.stage === "excluded" && r.exclusionCategory === "Duplicado").length
    const identified = totalRaw
    const screened = refs.filter((r) => r.stage !== "excluded" || r.exclusionCategory !== "Duplicado").length
    const screeningExcluded = refs.filter(
      (r) => r.stage === "excluded" && ["Remoção por Título", "Remoção por Resumo/Abstract", "Idioma", "Período", "Tipo de Publicação"].includes(r.exclusionCategory || "")
    )
    const excludedScreening = screeningExcluded.length
    const soughtRetrieval = screened - excludedScreening
    const notRetrieved = refs.filter((r) => r.stage === "excluded" && r.exclusionCategory === "Sem Texto Completo").length
    const assessed = refs.filter((r) => r.stage === "eligibility" || r.stage === "included" || (r.stage === "excluded" && ["Metodologia", "População", "Critério de Inclusão", "Estudo Secundário/Terciário", "Livro", "Capítulo de Livro", "Tese/Dissertação", "Relatório/Técnico", "Artigo Retratado", "Outro"].includes(r.exclusionCategory || ""))).length
    
    const eligibilityExcluded = refs.filter((r) => r.stage === "excluded" && ["Metodologia", "População", "Critério de Inclusão", "Estudo Secundário/Terciário", "Livro", "Capítulo de Livro", "Tese/Dissertação", "Relatório/Técnico", "Artigo Retratado", "Outro"].includes(r.exclusionCategory || ""))
    const excludedEligibility = eligibilityExcluded.length
    const included = refs.filter((r) => r.stage === "included").length

    const screeningReasons: Record<string, number> = {}
    screeningExcluded.forEach((r) => {
      const reason = r.exclusionCategory || "Outro"
      screeningReasons[reason] = (screeningReasons[reason] || 0) + 1
    })

    const excludedReasons: Record<string, number> = {}
    eligibilityExcluded.forEach((r) => {
      const reason = r.exclusionCategory || "Outro"
      excludedReasons[reason] = (excludedReasons[reason] || 0) + 1
    })

    return {
      identified,
      duplicates,
      screened,
      excludedScreening,
      soughtRetrieval,
      notRetrieved,
      assessed,
      excludedEligibility,
      included,
      screeningReasons,
      excludedReasons,
    }
  }, [project, state.references])

  if (!project) return null

  const handleExportSvg = () => {
    if (!flowRef.current) return
    const svgEl = flowRef.current.querySelector("svg")
    if (!svgEl) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svgEl)
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `prisma-${project.title.replace(/\s+/g, "-").toLowerCase()}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Fluxograma PRISMA 2020"
        subtitle="Visualize o fluxo da seleção de estudos conforme a recomendação PRISMA 2020."
        actions={
          <Button variant="outline" onClick={handleExportSvg}>
            <Download className="size-4" />
            Exportar SVG
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div ref={flowRef} className="flex justify-center overflow-x-auto">
              <PrismaSvg stats={stats} />
            </div>
          </CardContent>
        </Card>

        {Object.keys(stats.excludedReasons).length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-serif text-lg font-semibold mb-3">Razões de exclusão (elegibilidade)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(stats.excludedReasons).map(([reason, count]) => (
                  <div key={reason} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <span className="text-sm">{reason}</span>
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

interface FlowStats {
  identified: number
  duplicates: number
  screened: number
  excludedScreening: number
  soughtRetrieval: number
  notRetrieved: number
  assessed: number
  excludedEligibility: number
  included: number
  screeningReasons: Record<string, number>
  excludedReasons: Record<string, number>
}

function PrismaSvg({ stats }: { stats: FlowStats }) {
  // Estilos básicos
  const boxFill = "#ffffff"
  const boxStroke = "#1f2937"
  const headerFill = "#0f172a"
  const headerText = "#ffffff"
  const textColor = "#0f172a"
  const accent = "#0ea5e9"

  // Layout
  const W = 880
  const H = 760
  const colMainX = 120
  const colSideX = 540
  const boxW = 320
  const sideBoxW = 280

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ maxWidth: 900, fontFamily: "var(--font-sans, system-ui)" }}
      role="img"
      aria-label="Fluxograma PRISMA 2020"
    >
      {/* Faixas verticais (Identificação / Triagem / Inclusão) */}
      <g>
        <rect x={20} y={20} width={80} height={H - 40} fill="#f1f5f9" rx={8} />
        <text x={60} y={H / 2} fill={textColor} fontSize={13} fontWeight={600} textAnchor="middle" transform={`rotate(-90 60 ${H / 2})`}>
          Identificação
        </text>
      </g>

      {/* Cabeçalho */}
      <g>
        <rect x={colMainX} y={30} width={boxW} height={36} fill={headerFill} rx={6} />
        <text x={colMainX + boxW / 2} y={53} fill={headerText} fontSize={14} fontWeight={700} textAnchor="middle">
          Identificação de novos estudos
        </text>
      </g>

      {/* Box: Registros identificados */}
      <FlowBox
        x={colMainX}
        y={90}
        w={boxW}
        title="Registros identificados em bases de dados"
        lines={[`n = ${stats.identified} (100%)`]}
        fill={boxFill}
        stroke={boxStroke}
      />

      {/* Box lateral: duplicatas */}
      <FlowBox
        x={colSideX}
        y={90}
        w={sideBoxW}
        title="Registros removidos antes da triagem"
        lines={[`Duplicatas: n = ${stats.duplicates} (${stats.identified > 0 ? ((stats.duplicates / stats.identified) * 100).toFixed(1) : 0}%)`]}
        fill="#fff7ed"
        stroke="#fb923c"
      />

      {/* Seta para triagem */}
      <Arrow x1={colMainX + boxW / 2} y1={170} x2={colMainX + boxW / 2} y2={220} color={accent} />
      {/* Seta lateral identificados -> duplicatas */}
      <Arrow x1={colMainX + boxW} y1={130} x2={colSideX} y2={130} color={accent} />

      {/* Faixa Triagem */}
      <text x={60} y={H / 2 + 40} fill={textColor} fontSize={13} fontWeight={600} textAnchor="middle" />

      <FlowBox
        x={colMainX}
        y={230}
        w={boxW}
        title="Registros triados (título e resumo)"
        lines={[`n = ${stats.screened} (${stats.identified > 0 ? ((stats.screened / stats.identified) * 100).toFixed(1) : 0}%)`]}
        fill={boxFill}
        stroke={boxStroke}
      />
      <FlowBox
        x={colSideX}
        y={230}
        w={sideBoxW}
        title="Registros excluídos na triagem"
        lines={[
          `n = ${stats.excludedScreening}`,
          ...Object.entries(stats.screeningReasons).map(([reason, count]) => ` - ${reason}: ${count}`)
        ]}
        fill="#fef2f2"
        stroke="#ef4444"
      />
      <Arrow x1={colMainX + boxW / 2} y1={310} x2={colMainX + boxW / 2} y2={360} color={accent} />
      <Arrow x1={colMainX + boxW} y1={270} x2={colSideX} y2={270} color={accent} />

      <FlowBox
        x={colMainX}
        y={370}
        w={boxW}
        title="Registros buscados para recuperação"
        lines={[`n = ${stats.soughtRetrieval} (${stats.identified > 0 ? ((stats.soughtRetrieval / stats.identified) * 100).toFixed(1) : 0}%)`]}
        fill={boxFill}
        stroke={boxStroke}
      />
      <FlowBox
        x={colSideX}
        y={370}
        w={sideBoxW}
        title="Não recuperados"
        lines={[`n = ${stats.notRetrieved}`]}
        fill="#fef2f2"
        stroke="#ef4444"
      />
      <Arrow x1={colMainX + boxW / 2} y1={450} x2={colMainX + boxW / 2} y2={500} color={accent} />
      <Arrow x1={colMainX + boxW} y1={410} x2={colSideX} y2={410} color={accent} />

      <FlowBox
        x={colMainX}
        y={510}
        w={boxW}
        title="Registros avaliados para elegibilidade"
        lines={[`n = ${stats.assessed} (${stats.identified > 0 ? ((stats.assessed / stats.identified) * 100).toFixed(1) : 0}%)`]}
        fill={boxFill}
        stroke={boxStroke}
      />
      <FlowBox
        x={colSideX}
        y={510}
        w={sideBoxW}
        title="Registros excluídos (com razão)"
        lines={[
          `n = ${stats.excludedEligibility}`,
          ...Object.entries(stats.excludedReasons).map(([reason, count]) => ` - ${reason}: ${count}`)
        ]}
        fill="#fef2f2"
        stroke="#ef4444"
      />
      <Arrow x1={colMainX + boxW / 2} y1={590} x2={colMainX + boxW / 2} y2={640} color={accent} />
      <Arrow x1={colMainX + boxW} y1={550} x2={colSideX} y2={550} color={accent} />

      {/* Faixa Inclusão */}
      <g>
        <rect x={colMainX} y={650} width={boxW} height={36} fill="#0f766e" rx={6} />
        <text x={colMainX + boxW / 2} y={673} fill="#ffffff" fontSize={14} fontWeight={700} textAnchor="middle">
          Estudos incluídos na revisão
        </text>
      </g>
      <g>
        <rect x={colMainX} y={696} width={boxW} height={48} fill="#ecfeff" stroke="#0e7490" strokeWidth={1.5} rx={8} />
        <text x={colMainX + boxW / 2} y={727} fill="#0f172a" fontSize={18} fontWeight={700} textAnchor="middle">
          n = {stats.included} ({stats.identified > 0 ? ((stats.included / stats.identified) * 100).toFixed(1) : 0}%)
        </text>
      </g>
    </svg>
  )
}

function FlowBox({
  x,
  y,
  w,
  title,
  lines,
  fill,
  stroke,
}: {
  x: number
  y: number
  w: number
  title: string
  lines: string[]
  fill: string
  stroke: string
}) {
  const h = Math.max(70, 40 + lines.length * 16)
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={1.5} rx={8} />
      <text x={x + 12} y={y + 22} fill="#0f172a" fontSize={12} fontWeight={600}>
        {title}
      </text>
      {lines.map((line, i) => (
        <text key={i} x={x + 12} y={y + 44 + i * 16} fill="#334155" fontSize={13}>
          {line.length > 40 ? line.substring(0, 37) + '...' : line}
        </text>
      ))}
    </g>
  )
}

function Arrow({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  return (
    <g>
      <defs>
        <marker id={`arrow-${x1}-${y1}-${x2}-${y2}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={2}
        markerEnd={`url(#arrow-${x1}-${y1}-${x2}-${y2})`}
      />
    </g>
  )
}
