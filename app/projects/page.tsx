"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { WorkspaceSidebar } from "@/components/litmap/workspace-sidebar"
import { useEffect } from "react"

// ---------------------------------------------------------------------------
// Mock de dados — substituir por fetch Prisma depois
// ---------------------------------------------------------------------------
const MOCK_PROJECTS: any[] = []

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: "Ativo",      color: "#6B8F71", bg: "rgba(107,143,113,0.12)" },
  completed: { label: "Concluído",  color: "#2980B9", bg: "rgba(41,128,185,0.12)"  },
  archived:  { label: "Arquivado",  color: "#9c9894", bg: "rgba(156,152,148,0.12)" },
}

// ---------------------------------------------------------------------------
export default function ProjectsPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/projects")
        if (res.ok) {
          const data = await res.json()
          setProjects(data)
        }
      } catch (err) {
        console.error("Failed to load projects", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProjects()
  }, [])

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.area.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#1C1C1E]">

      {/* ── Sidebar ── */}
      <WorkspaceSidebar />

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col ml-64 bg-[#FAF8F4] h-screen overflow-hidden">

        {/* Top Bar */}
        <header className="flex justify-between items-center h-16 px-8 sticky top-0 z-40 bg-[#FAF8F4] border-b border-[#E5E2DA]">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1C1C1E]">Meus Projetos</h2>
              <p className="text-[10px] font-mono text-[#9c9894] uppercase tracking-wider">
                {filtered.length} projeto{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9c9894] text-[18px]">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-transparent border-b border-[#E5E2DA] focus:border-[#6B8F71] outline-none font-mono text-sm text-[#1C1C1E] w-60 placeholder:text-[#9c9894] transition-colors"
                placeholder="Pesquisar projetos..."
                type="text"
              />
            </div>

            {/* New project button */}
            <button
              onClick={() => router.push("/projects/new")}
              className="flex items-center gap-2 bg-[#1C1C1E] text-white px-4 py-2 text-sm font-serif font-medium hover:bg-[#6B8F71] transition-colors duration-200 rounded"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Novo Projeto
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Total de Projetos", value: projects.length, icon: "folder_open",   color: "#1C1C1E" },
                { label: "Em Andamento",      value: projects.filter(p => p.status === "active").length, icon: "pending_actions", color: "#6B8F71" },
                { label: "Concluídos",        value: projects.filter(p => p.status === "completed").length, icon: "task_alt",      color: "#2980B9" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white border border-[#E5E2DA] rounded-lg p-5 flex items-center gap-4 relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: s.color }} />
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: `${s.color}15` }}
                  >
                    <span className="material-symbols-outlined text-[20px]" style={{ color: s.color, fontVariationSettings: "'FILL' 1" }}>
                      {s.icon}
                    </span>
                  </div>
                  <div>
                    <div className="font-serif text-3xl font-bold text-[#1C1C1E] leading-none">{s.value}</div>
                    <div className="font-mono text-[10px] text-[#9c9894] uppercase tracking-wider mt-1">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Projects grid */}
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="font-mono text-sm text-[#9c9894] animate-pulse">A carregar projetos...</div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((project) => {
                  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.active
                  const totalRefs = project._count?.references || 0
                  // Temporary zeros until we group by stage in the API
                  const pctIncluded = 0
                  const pctExcluded = 0

                  const updatedAt = new Date(project.updatedAt).toLocaleDateString("pt-PT", {
                    day: "2-digit", month: "short"
                  })

                return (
                  <Link key={project.id} href={`/projects/${project.slug}/dashboard`}>
                    <div className="group bg-white border border-[#E5E2DA] rounded-lg p-6 hover:shadow-lg hover:border-[#6B8F71]/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col h-full">

                      {/* Card Top Row */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-[#FAF8F4] rounded-lg flex items-center justify-center border border-[#E5E2DA] group-hover:bg-[#6B8F71]/10 group-hover:border-[#6B8F71]/30 transition-colors">
                          <span className="material-symbols-outlined text-[20px] text-[#9c9894] group-hover:text-[#6B8F71] transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>
                            library_books
                          </span>
                        </div>
                        <span
                          className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded"
                          style={{ color: status.color, background: status.bg }}
                        >
                          {status.label}
                        </span>
                      </div>

                      {/* Title + Area */}
                      <h3 className="font-serif text-base font-bold text-[#1C1C1E] mb-1 group-hover:text-[#6B8F71] transition-colors leading-snug">
                        {project.title}
                      </h3>
                      <p className="font-mono text-[10px] text-[#9c9894] uppercase tracking-wider mb-4">
                        {project.reviewType} · {project.area}
                      </p>

                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-[10px] font-mono text-[#9c9894] mb-1.5">
                          <span>{totalRefs} referências</span>
                          <span className="text-[#6B8F71]">{pctIncluded}% incluídas</span>
                        </div>
                        <div className="h-1.5 bg-[#FAF8F4] rounded-full overflow-hidden flex border border-[#E5E2DA]">
                          <div className="h-full bg-[#6B8F71] transition-all" style={{ width: `${pctIncluded}%` }} />
                          <div className="h-full bg-[#ba1a1a]/40 transition-all" style={{ width: `${pctExcluded}%` }} />
                        </div>
                      </div>

                      {/* Meta footer */}
                      <div className="mt-auto pt-4 border-t border-[#FAF8F4] flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[#9c9894] text-[11px] font-mono">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {updatedAt}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">group</span>
                            {project._count?.members || 1}
                          </span>
                        </div>
                        <span className="material-symbols-outlined text-[18px] text-[#E5E2DA] group-hover:text-[#6B8F71] group-hover:translate-x-0.5 transition-all">
                          arrow_forward
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}

              {/* New project card */}
              <button
                onClick={() => router.push("/projects/new")}
                className="group border-2 border-dashed border-[#E5E2DA] rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-white hover:border-[#6B8F71] hover:shadow-md transition-all duration-200 cursor-pointer min-h-[240px]"
              >
                <div className="w-12 h-12 rounded-full bg-[#FAF8F4] flex items-center justify-center mb-4 group-hover:bg-[#6B8F71]/10 transition-colors border border-[#E5E2DA] group-hover:border-[#6B8F71]/30">
                  <span className="material-symbols-outlined text-[24px] text-[#9c9894] group-hover:text-[#6B8F71] transition-colors">add</span>
                </div>
                <p className="font-serif font-semibold text-sm text-[#5c5955] group-hover:text-[#6B8F71] transition-colors">
                  Criar Novo Projeto
                </p>
                <p className="font-mono text-[10px] text-[#9c9894] uppercase tracking-wider mt-1">
                  Revisão ou Mapeamento
                </p>
              </button>
            </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}
