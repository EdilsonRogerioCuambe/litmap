"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import { PageHeader } from "@/components/litmap/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Layers, Search } from "lucide-react"
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function SynthesisView() {
  const { state } = useStore()
  const project = state.project
  const [query, setQuery] = useState("")

  const themes = useMemo(() => {
    if (!project) return []
    const map = new Map<string, { theme: string; refs: { id: string; title: string; authors: string[]; year: number; finding: string }[] }>()
    state.themes.forEach((t) => {
      map.set(t.name, { theme: t.name, refs: [] })
      t.referenceIds.forEach((refId) => {
        const r = state.references.find((x) => x.id === refId)
        if (r && r.stage === "included") {
          const ext = state.extractions.find((e) => e.referenceId === refId)
          map.get(t.name)!.refs.push({
            id: r.id,
            title: r.title,
            authors: r.authors,
            year: r.year || 0,
            finding: ext?.keyFindings || "",
          })
        }
      })
    })
    return Array.from(map.values()).sort((a, b) => b.refs.length - a.refs.length)
  }, [project, state.themes, state.references, state.extractions])

  const chartData = useMemo(
    () => themes.slice(0, 8).map((t) => ({ tema: t.theme.length > 22 ? t.theme.slice(0, 20) + "…" : t.theme, estudos: t.refs.length })),
    [themes],
  )

  const filteredThemes = useMemo(() => {
    if (!query.trim()) return themes
    const q = query.toLowerCase()
    return themes.filter(
      (t) =>
        t.theme.toLowerCase().includes(q) ||
        t.refs.some((r) => r.title.toLowerCase().includes(q) || r.finding.toLowerCase().includes(q)),
    )
  }, [themes, query])

  if (!project) return null

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Síntese temática"
        subtitle="Visualize como os temas extraídos se conectam entre os estudos incluídos."
      />

      <div className="flex-1 p-6 space-y-6">
        {themes.length === 0 ? (
          <Empty className="max-w-md mx-auto">
            <EmptyHeader>
              <Layers className="size-12 text-muted-foreground" />
              <EmptyTitle>Nenhum tema cadastrado ainda</EmptyTitle>
              <EmptyDescription>
                Vá até a aba Extração de dados, abra um estudo incluído e adicione temas na aba &quot;Temas&quot;.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="font-serif text-lg font-semibold">Distribuição de temas</h3>
                    <p className="text-sm text-muted-foreground">Frequência dos temas mais citados nos estudos incluídos</p>
                  </div>
                  <Badge variant="secondary">{themes.length} temas</Badge>
                </div>
                <ChartContainer
                  config={{
                    estudos: { label: "Estudos", color: "hsl(var(--primary))" },
                  }}
                  className="h-72 w-full"
                >
                  <ResponsiveContainer>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid horizontal={false} stroke="var(--border)" />
                      <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis
                        type="category"
                        dataKey="tema"
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        width={140}
                      />
                      <RechartsTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="estudos" fill="var(--color-estudos)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="font-serif text-lg font-semibold">Matriz tema × estudo</h3>
                  <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar tema ou achado..."
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredThemes.map((t) => (
                    <div key={t.theme} className="rounded-lg border border-border overflow-hidden">
                      <div className="bg-muted px-4 py-2.5 flex items-center justify-between">
                        <div className="font-medium text-sm">{t.theme}</div>
                        <Badge variant="secondary">{t.refs.length} estudo(s)</Badge>
                      </div>
                      <div className="divide-y divide-border">
                        {t.refs.map((r) => (
                          <div key={r.id} className="px-4 py-3 text-sm">
                            <div className="font-medium">
                              {r.authors[0] || "—"}
                              {r.authors.length > 1 ? " et al." : ""} ({r.year})
                            </div>
                            <div className="text-muted-foreground line-clamp-2 mt-0.5">{r.title}</div>
                            {r.finding && (
                              <div className="mt-2 text-foreground/80 text-sm leading-relaxed line-clamp-3">
                                <span className="text-xs uppercase tracking-wide text-muted-foreground mr-1">
                                  Achado:
                                </span>
                                {r.finding}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
