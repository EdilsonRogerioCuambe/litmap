"use client"

import { X, ArrowRightLeft, Trash2, Star, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { STAGE_COLORS, STAGE_LABELS, STAGES, Stage, ExclusionCategory } from "@/lib/types"

interface BulkActionsToolbarProps {
  selectedCount: number
  onClear: () => void
  onMove: (target: Stage) => void
  onExclude: (cat: ExclusionCategory) => void
  onExport: () => void
}

export function BulkActionsToolbar({
  selectedCount,
  onClear,
  onMove,
  onExclude,
  onExport,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C1E] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-8 duration-300">
      <div className="flex items-center gap-3 pr-6 border-r border-white/10">
        <div className="w-6 h-6 bg-[#6B8F71] rounded-full flex items-center justify-center text-[10px] font-bold">
          {selectedCount}
        </div>
        <span className="text-sm font-medium">referências selecionadas</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-white/50 hover:text-white hover:bg-white/10 h-7 px-2 ml-2"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 h-9 font-serif font-bold text-xs gap-2"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" /> Mover para
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#E5E2DA] p-1">
            {STAGES.map((s) => (
              <DropdownMenuItem
                key={s}
                className="gap-2 text-xs"
                onClick={() => onMove(s)}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: STAGE_COLORS[s].border }} />
                {STAGE_LABELS[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#EF4444] hover:bg-[#EF4444]/10 h-9 font-serif font-bold text-xs gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir com motivo
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl border-[#E5E2DA] p-1">
            {[
              "Duplicado",
              "Fora do tema",
              "Metodologia inadequada",
              "Idioma não incluído",
              "Tipo de publicação excluído",
              "Não é um estudo primário",
            ].map((cat) => (
              <DropdownMenuItem
                key={cat}
                className="text-xs"
                onClick={() => onExclude(cat as ExclusionCategory)}
              >
                {cat}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          className="text-white hover:bg-white/10 h-9 font-serif font-bold text-xs gap-2"
        >
          <Download className="w-3.5 h-3.5" /> Exportar
        </Button>
      </div>
    </div>
  )
}
