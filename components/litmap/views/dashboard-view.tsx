"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import { PageHeader, StageBadge } from "../page-header"
import { Button } from "@/components/ui/button"
import { AddReferenceModal, ReferenceDetailModal } from "../reference-modal"
import { Plus, Lightbulb } from "lucide-react"
import type { Reference } from "@/lib/types"
import { STAGE_COLORS, STAGE_LABELS } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

export function DashboardView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { state } = useStore()
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
      .slice(0, 10)
  }, [refs])

  const noExtractionForIncluded = useMemo(() => {
    const includedIds = refs.filter((r) => r.stage === "included").map((r) => r.id)
    const withExtraction = new Set(state.extractions.map((e) => e.referenceId))
    return includedIds.filter((id) => !withExtraction.has(id)).length
  }, [refs, state.extractions])

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={
          <>
            <span className="font-serif italic">{project.title}</span>
          </>
        }
        actions={
          <Button
            onClick={() => setOpenAdd(true)}
            style={{ background: "var(--accent)" }}
            className="gap-2 text-white hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Adicionar Referência
          </Button>
        }
      />

      <div className="px-8 py-8 space-y-8">
        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total de Referências" value={counts.total} color="#18181b" />
          <StatCard label="Incluídas" value={counts.included} color="#2E7D52" />
          <StatCard label="Excluídas" value={counts.excluded} color="#C4914A" />
          <StatCard label="A Rever" value={toReview} color="#3A6FA8" />
        </div>

        {/* PRISMA funnel */}
        <Card>
          <h2 className="font-serif text-xl mb-1">Funil PRISMA</h2>
          <p className="text-sm text-[#5c5955] mb-5">Distribuição actual das referências por fase.</p>
          <div className="space-y-3">
            {(["identification", "screening", "eligibility", "included", "excluded"] as const).map(
              (stage) => {
                const count = counts[stage]
                const pct = counts.total ? Math.round((count / counts.total) * 100) : 0
                const sc = STAGE_COLORS[stage]
                return (
                  <div key={stage} className="flex items-center gap-4">
                    <div className="w-32 shrink-0 text-sm font-medium text-[#18181b]">
                      {STAGE_LABELS[stage]}
                    </div>
                    <div className="flex-1 h-7 bg-[#f0ede8] rounded-md overflow-hidden relative">
                      <div
                        className="h-full transition-all"
                        style={{ width: `${pct}%`, background: sc.border }}
                      />
                    </div>
                    <div className="w-24 shrink-0 text-right text-sm font-mono text-[#5c5955]">
                      {count} <span className="text-[#9c9894]">({pct}%)</span>
                    </div>
                  </div>
                )
              },
            )}
          </div>
        </Card>

        {/* Two-column row */}
        <div className="grid lg:grid-cols-[3fr_2fr] gap-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl">Actividade Recente</h2>
              <button
                onClick={() => onNavigate("kanban")}
                className="text-sm text-[#5c7e6b] hover:underline"
              >
                Ver todas →
              </button>
            </div>
            {recent.length === 0 ? (
              <div className="text-center py-10 text-[#9c9894] text-sm">
                Ainda sem actividade. Adiciona ou importa referências.
              </div>
            ) : (
              <div className="divide-y divide-[#e2ddd8]">
                {recent.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setDetailRef(r)}
                    className="w-full text-left py-3 hover:bg-[#f7f4ef] -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-serif text-sm leading-snug truncate">{r.title}</div>
                        <div className="text-xs text-[#9c9894] mt-0.5 truncate">
                          {r.authors.join(", ") || "—"}
                          {r.year ? ` · ${r.year}` : ""}
                        </div>
                      </div>
                      <StageBadge stage={r.stage} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-xl">Resumo do Projecto</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-[#9c9894] mb-1">
                  Pergunta de investigação
                </div>
                <div className="text-[#18181b] leading-relaxed text-pretty">
                  {project.researchQuestion}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-[#9c9894] mb-1.5">
                  Bases de dados
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {project.databases.map((db) => (
                    <Badge
                      key={db}
                      variant="secondary"
                      className="bg-[#f0ede8] text-[#5c5955]"
                    >
                      {db}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-[#9c9894] mb-1.5">
                  Palavras-chave
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {project.keywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="secondary"
                      className="bg-[#eaf1ed] text-[#5c7e6b]"
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-[#9c9894] mb-1">
                  Período
                </div>
                <div className="font-mono text-xs text-[#5c5955]">
                  {project.yearFrom || "—"} – {project.yearTo || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-[#9c9894] mb-1">
                  Tipo de revisão
                </div>
                <div className="text-[#18181b]">{project.reviewType}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Suggestions */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-[#c4914a]" />
            <h2 className="font-serif text-xl">Alertas e Sugestões</h2>
          </div>
          <div className="space-y-2 text-sm">
            {counts.total === 0 && (
              <Alert>
                Começa por importar referências ou adicionar manualmente.
              </Alert>
            )}
            {noExtractionForIncluded > 0 && (
              <Alert tone="warn">
                Tens {noExtractionForIncluded} artigo(s) incluído(s) sem extracção de dados.
              </Alert>
            )}
            {state.themes.length === 0 && counts.included > 0 && (
              <Alert tone="info">
                Cria temas para organizar a tua síntese narrativa.
              </Alert>
            )}
            {counts.total > 0 &&
              noExtractionForIncluded === 0 &&
              state.themes.length > 0 && (
                <Alert tone="ok">Tudo em ordem. Boa pesquisa!</Alert>
              )}
          </div>
        </Card>
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

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e2ddd8] rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
      {children}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="bg-white border border-[#e2ddd8] rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="font-serif text-[44px] leading-none text-[#18181b]">{value}</div>
      <div className="text-sm text-[#5c5955] mt-2">{label}</div>
    </div>
  )
}

function Alert({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" | "ok" }) {
  const map = {
    info: { bg: "#E8EFF8", text: "#3A6FA8" },
    warn: { bg: "#FDF3E7", text: "#C4914A" },
    ok: { bg: "#E8F5EE", text: "#2E7D52" },
  } as const
  const s = map[tone]
  return (
    <div className="rounded-md px-3 py-2 text-sm" style={{ background: s.bg, color: s.text }}>
      {children}
    </div>
  )
}
