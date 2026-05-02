"use client"

import { useStore } from "@/lib/store"
import { useRouter, usePathname, useParams } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useSession } from "@/lib/auth-client"
import { Menu, X, Bell, History, Search, LogOut, HelpCircle, ArrowLeft, User as UserIcon } from "lucide-react"
import { getProjectAction } from "@/lib/actions/project"
import { Project, Reference, Extraction, Theme, ImportBatch } from "@/lib/types"

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { state, hydrated, importState } = useStore()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const slug = params.slug as string
  const { data: session } = useSession()

  const [isFetching, setIsFetching] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    async function loadProject() {
      try {
        const data = await getProjectAction(slug)
        
        importState({
          project: data as unknown as Project,
          references: (data.references || []) as unknown as Reference[],
          extractions: [] as unknown as Extraction[],
          themes: (data.themes || []) as unknown as Theme[],
          imports: (data.importBatches || []) as unknown as ImportBatch[]
        })
      } catch (err) {
        console.error("Failed to load project", err)
        router.push("/projects")
      } finally {
        setIsFetching(false)
      }
    }

    if (hydrated) {
      loadProject()
    }
    // Only reload when the project slug changes (not on every tab/page navigation within the same project)
  }, [hydrated, slug])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  if (!hydrated || isFetching) {
    return (
      <div className="flex h-screen items-center justify-center bg-background z-[9999]">
        <div className="flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center mb-8">
            {/* Pulsing rings */}
            <div className="absolute w-24 h-24 bg-secondary/20 rounded-full animate-ping"></div>
            <div className="absolute w-16 h-16 bg-secondary/40 rounded-full animate-pulse"></div>
            
            {/* Central Logo Box */}
            <div className="relative w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-on-secondary font-serif font-bold text-2xl shadow-xl shadow-secondary/30">
              L
            </div>
          </div>
          
          <div className="mt-4 flex flex-col items-center gap-2">
            <h3 className="font-serif font-bold text-primary text-lg">A carregar ambiente...</h3>
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!state.project) return null

  const project = state.project

  const navItems = [
    { id: "dashboard", icon: "dashboard", label: "Visão Geral", path: `/projects/${slug}/dashboard` },
    { id: "references", icon: "library_books", label: "Biblioteca", path: `/projects/${slug}/references` },
    { id: "analytics", icon: "analytics", label: "Análises", path: `/projects/${slug}/analytics` },
    { id: "team", icon: "group", label: "Colaboração", path: `/projects/${slug}/team` },
    { id: "import", icon: "upload_file", label: "Importação", path: `/projects/${slug}/import` },
    { id: "kanban", icon: "view_kanban", label: "Triagem", path: `/projects/${slug}/kanban` },
    { id: "extraction", icon: "table_chart", label: "Extração", path: `/projects/${slug}/extraction` },
    { id: "synthesis", icon: "edit_document", label: "Síntese", path: `/projects/${slug}/synthesis` },
    { id: "prisma", icon: "account_tree", label: "PRISMA", path: `/projects/${slug}/prisma` },
    { id: "export", icon: "download", label: "Exportar", path: `/projects/${slug}/export` },
    { id: "settings", icon: "settings", label: "Definições", path: `/projects/${slug}/settings` },
  ]

  return (
    <div className="font-body-md text-on-background flex h-screen overflow-hidden selection:bg-secondary-container selection:text-on-secondary-container bg-[#FAF8F4]">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[45] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SideNavBar */}
      <nav className={cn(
        "h-screen w-64 fixed left-0 top-0 border-r border-[#E5E2DA]/10 bg-[#1C1C1E] z-[40] flex flex-col py-8 text-sm transition-transform duration-300 ease-in-out lg:translate-x-0",
        isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="px-6 mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#5c7e6b] rounded-xl flex items-center justify-center text-white font-serif font-bold text-2xl shrink-0 shadow-lg shadow-[#5c7e6b]/20">
              L
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-white tracking-tight">LitMap</h1>
              <p className="font-mono text-[11px] text-[#6B8F71] uppercase tracking-wider mt-0.5">Área de Trabalho</p>
            </div>
          </div>
          <button className="lg:hidden text-white/50 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto scroll-hidden px-0">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path
              return (
                <li key={item.id}>
                  <Link 
                    href={item.path}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 transition-colors duration-200",
                      isActive 
                        ? "text-white border-l-4 border-[#6B8F71] bg-white/5 font-semibold" 
                        : "text-gray-400 font-normal hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <span 
                      className="material-symbols-outlined" 
                      style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon}
                    </span>
                    <span className="font-serif font-medium text-sm tracking-wide">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
        
        <div className="px-6 mt-auto space-y-4">
          <ul className="space-y-1 border-b border-[#E5E2DA]/10 pb-4">
            <li>
              <a className="flex items-center gap-3 py-2 px-2 text-gray-400 font-normal hover:text-white transition-colors duration-200" href="#">
                <HelpCircle className="w-4 h-4" />
                <span className="font-serif font-medium text-sm tracking-wide">Ajuda</span>
              </a>
            </li>
            <li>
              <button 
                onClick={() => router.push("/")}
                className="flex w-full items-center gap-3 py-2 px-2 text-gray-400 font-normal hover:text-white transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-serif font-medium text-sm tracking-wide">Sair</span>
              </button>
            </li>
          </ul>

          {/* Profile mini */}
          <div className="flex items-center gap-3 px-1 py-2">
            {session?.user?.image ? (
              <img 
                src={session.user.image} 
                alt={session.user.name || "User"} 
                className="w-8 h-8 rounded-full object-cover shrink-0" 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#6B8F71]/30 flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4 text-[#6B8F71]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold font-serif truncate">
                {session?.user?.name || "Investigador"}
              </p>
              <p className="text-white/40 text-[10px] font-mono truncate">
                {session?.user?.email || "litmap.app"}
              </p>
            </div>
          </div>

          <button 
            onClick={() => router.push("/projects")}
            className="w-full group flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-[#6B8F71]/10 hover:border-[#6B8F71]/30 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-1.5 rounded-md text-gray-300 group-hover:bg-[#6B8F71] group-hover:text-white transition-colors duration-300">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-serif font-medium text-[13px] text-gray-200 group-hover:text-white transition-colors">Projetos</span>
                <span className="text-[10px] text-gray-500 font-mono tracking-wider uppercase group-hover:text-[#6B8F71]/80 transition-colors">Voltar</span>
              </div>
            </div>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64 bg-[#FAF8F4] min-h-0 overflow-hidden relative z-0 w-full transition-all duration-300">
        {/* TopAppBar */}
        <header className="flex justify-between items-center h-16 px-4 lg:px-8 sticky top-0 z-30 bg-[#FAF8F4]/80 backdrop-blur-md border-b border-[#E5E2DA]">
          <div className="flex items-center gap-4 min-w-0">
            <button 
              className="lg:hidden p-2 text-[#1C1C1E] hover:bg-[#E5E2DA]/30 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-serif text-lg lg:text-xl font-bold text-[#1C1C1E] truncate">
              {project.title}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-6">
            <div className="relative hidden xl:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] w-4 h-4" />
              <input 
                className="pl-9 pr-4 py-1.5 bg-transparent border border-[#E5E2DA] rounded-full focus:border-[#6B8F71] focus:ring-1 focus:ring-[#6B8F71] outline-none font-mono text-sm text-[#1C1C1E] w-48 xl:w-64 placeholder:text-[#A1A1AA] transition-all" 
                placeholder="Pesquisar..." 
                type="text"
              />
            </div>
            <div className="flex items-center gap-2 lg:gap-4 border-l border-[#E5E2DA] pl-4 lg:pl-6">
              <button className="p-2 text-[#1C1C1E] hover:text-[#6B8F71] transition-colors rounded-full hover:bg-[#FAF8F4]">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-[#1C1C1E] hover:text-[#6B8F71] transition-colors rounded-full hover:bg-[#FAF8F4]">
                <History className="w-5 h-5" />
              </button>
              <button 
                onClick={() => router.push(`/projects/${slug}/export`)}
                className="hidden sm:block font-serif font-semibold border border-[#1C1C1E] text-[#1C1C1E] px-4 py-1.5 rounded-md hover:bg-[#1C1C1E] hover:text-white transition-all text-sm"
              >
                Exportar
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-h-0 overflow-y-auto relative w-full">
          <div className="h-full w-full max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
