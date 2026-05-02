"use client"

import { useStore } from "@/lib/store"
import { Sidebar } from "@/components/litmap/sidebar"
import { Onboarding } from "@/components/litmap/onboarding"
import { DashboardView } from "@/components/litmap/views/dashboard-view"
import { KanbanView } from "@/components/litmap/views/kanban-view"
import { ImportView } from "@/components/litmap/views/import-view"
import { ExtractionView } from "@/components/litmap/views/extraction-view"
import { SynthesisView } from "@/components/litmap/views/synthesis-view"
import { PrismaView } from "@/components/litmap/views/prisma-view"
import { ExportView } from "@/components/litmap/views/export-view"
import { useState } from "react"
import type { NavId } from "@/components/litmap/sidebar"

export function AppShell() {
  const { state, hydrated } = useStore()
  const [activeView, setActiveView] = useState<NavId>("dashboard")

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Carregando…</div>
      </div>
    )
  }

  if (!state.project?.id) {
    return <Onboarding />
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active={activeView} onNavigate={setActiveView} />
      <main className="flex-1 overflow-auto bg-[#f7f4ef]">
        {activeView === "dashboard" && <DashboardView onNavigate={(id) => setActiveView(id as NavId)} />}
        {activeView === "import" && <ImportView />}
        {activeView === "kanban" && <KanbanView onNavigate={(id) => setActiveView(id as NavId)} />}
        {activeView === "extraction" && <ExtractionView />}
        {activeView === "synthesis" && <SynthesisView />}
        {activeView === "prisma" && <PrismaView />}
        {activeView === "export" && <ExportView />}
      </main>
    </div>
  )
}
