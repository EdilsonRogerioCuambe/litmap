"use client"

import { WorkspaceSidebar } from "@/components/litmap/workspace-sidebar"

export default function FavoritesPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#1C1C1E]">
      <WorkspaceSidebar />

      <div className="flex-1 flex flex-col ml-64 bg-[#FAF8F4] h-screen overflow-hidden">
        <header className="flex justify-between items-center h-16 px-8 sticky top-0 z-40 bg-[#FAF8F4] border-b border-[#E5E2DA]">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#1C1C1E]">Projetos Favoritos</h2>
            <p className="text-[10px] font-mono text-[#9c9894] uppercase tracking-wider">
              Projetos marcados com estrela
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#F1C40F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px] text-[#F1C40F]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1C1C1E] mb-2">Nenhum Favorito</h3>
            <p className="text-[#9c9894] text-sm">Marque projetos como favoritos para que apareçam aqui.</p>
          </div>
        </main>
      </div>
    </div>
  )
}
