"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSession } from "@/lib/auth-client"

export function WorkspaceSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()

  const navItems = [
    { icon: "folder_open", label: "Meus Projetos", href: "/projects" },
    { icon: "add_circle", label: "Novo Projeto", href: "/projects/new" },
    { icon: "bar_chart", label: "Estatísticas", href: "/projects/statistics" },
    { icon: "bookmark", label: "Favoritos", href: "/projects/favorites" },
  ]

  return (
    <nav className="h-screen w-64 fixed left-0 top-0 border-r border-white/5 bg-[#1C1C1E] z-50 flex flex-col py-8 text-sm">
      {/* Logo */}
      <div className="px-6 mb-10 flex items-center gap-4">
        <div className="w-10 h-10 bg-[#5c7e6b] rounded-xl flex items-center justify-center text-white font-serif font-bold text-2xl shrink-0 shadow-lg shadow-[#5c7e6b]/20">
          L
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-tight">LitMap</h1>
          <p className="font-mono text-[11px] text-[#6B8F71] uppercase tracking-wider mt-0.5">Área de Trabalho</p>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto px-0">
        <p className="px-6 text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">Navegação</p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 transition-colors duration-200",
                    isActive
                      ? "text-white border-l-4 border-[#6B8F71] bg-white/5 font-semibold"
                      : "text-gray-400 font-normal hover:bg-white/10 hover:text-white border-l-4 border-transparent"
                  )}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
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

      {/* Bottom actions */}
      <div className="px-6 mt-auto space-y-4">
        <ul className="space-y-1 border-b border-white/10 pb-4">
          <li>
            <a className="flex items-center gap-3 py-2 px-2 text-gray-400 hover:text-white transition-colors duration-200" href="#">
              <span className="material-symbols-outlined text-[18px]">help_outline</span>
              <span className="font-serif font-medium text-sm tracking-wide">Ajuda</span>
            </a>
          </li>
          <li>
            <button
              onClick={() => router.push("/")}
              className="flex w-full items-center gap-3 py-2 px-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
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
              <span className="material-symbols-outlined text-[#6B8F71] text-[16px]">person</span>
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
      </div>
    </nav>
  )
}
