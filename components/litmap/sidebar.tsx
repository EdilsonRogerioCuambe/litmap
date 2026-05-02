"use client"

import { cn } from "@/lib/utils"
import {
  BookOpen,
  Columns3,
  FileDown,
  FlaskConical,
  GitBranch,
  HelpCircle,
  LayoutDashboard,
  RotateCcw,
  Upload,
} from "lucide-react"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useStore } from "@/lib/store"

export type NavId =
  | "dashboard"
  | "kanban"
  | "import"
  | "extraction"
  | "synthesis"
  | "prisma"
  | "export"

const NAV_ITEMS: { id: NavId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "kanban", label: "Kanban", icon: Columns3 },
  { id: "import", label: "Importar Referências", icon: Upload },
  { id: "extraction", label: "Extracção de Dados", icon: FlaskConical },
  { id: "synthesis", label: "Síntese Temática", icon: BookOpen },
  { id: "prisma", label: "Fluxograma PRISMA", icon: GitBranch },
  { id: "export", label: "Exportar", icon: FileDown },
]

export function Sidebar({
  active,
  onNavigate,
}: {
  active: NavId
  onNavigate: (id: NavId) => void
}) {
  const { resetAll } = useStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  return (
    <aside className="hidden md:flex w-60 shrink-0 bg-[#18181b] text-[#f7f4ef] flex-col h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="font-serif text-2xl leading-none">LitMap</div>
        <div className="text-xs text-white/60 mt-1.5 leading-snug font-sans">
          Mapeamento sistemático
          <br />
          da literatura
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors text-left relative",
                isActive
                  ? "bg-white/5 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r"
                  style={{ background: "var(--accent)" }}
                />
              )}
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden />
          <span>Dados guardados localmente</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Guia rápido
          </button>
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-[#fdeaea]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
        <div className="text-[10px] text-white/30 font-mono">v1.0.0 · PRISMA 2020</div>
      </div>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Reiniciar projecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os dados — projecto, referências, extracções, temas e síntese — serão
              eliminados. Esta acção não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetAll()
                setConfirmReset(false)
              }}
              className="bg-[#b94040] hover:bg-[#a23434] text-white"
            >
              Eliminar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Guia rápido</DialogTitle>
            <DialogDescription>
              Pequena referência sobre como usar o LitMap.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm leading-relaxed">
            <div>
              <h3 className="font-serif text-base mb-1">Kanban PRISMA</h3>
              <p className="text-[#5c5955]">
                Arrasta cartões entre as colunas para mover referências entre fases. Ao mover
                para &quot;Excluído&quot;, regista o motivo de exclusão.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-base mb-1">Formatos suportados</h3>
              <p className="text-[#5c5955]">
                BibTeX (.bib), RIS (.ris), CSV/TSV, NBIB (PubMed), XML e ficheiros de texto
                etiquetados (.txt). A detecção é automática com base na extensão.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-base mb-1">PRISMA 2020</h3>
              <p className="text-[#5c5955]">
                O fluxograma é gerado automaticamente. Os contadores reflectem em tempo real os
                estados das referências e respectivas razões de exclusão.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-base mb-1">Privacidade</h3>
              <p className="text-[#5c5955]">
                Tudo fica guardado no teu navegador (localStorage). Nada é enviado para
                servidores externos.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
