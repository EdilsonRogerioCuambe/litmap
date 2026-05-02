"use client"

import { Microscope, Search, Filter, Database, Calendar, Plus, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface KanbanHeaderProps {
  onAddReference: () => void
  onOpenDuplicateFinder: () => void
}

export function KanbanHeader({
  onAddReference,
  onOpenDuplicateFinder,
}: KanbanHeaderProps) {
  return (
    <div className="px-8 py-5 bg-white border-b border-[#E5E2DA] flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1C1C1E] flex items-center gap-3">
            <Microscope className="w-6 h-6 text-[#6B8F71]" />
            Quadro de Triagem PRISMA
          </h1>
          <p className="text-sm text-[#5C5955] mt-1">
            Siga o protocolo científico para seleccionar estudos de alta qualidade.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={onOpenDuplicateFinder}
            variant="outline"
            className="border-amber-400 text-amber-700 hover:bg-amber-50 rounded-xl font-serif font-bold text-sm gap-2 h-10 px-5"
          >
            <Copy className="w-4 h-4" />
            Detetar Duplicados
          </Button>
          <Button
            onClick={onAddReference}
            variant="outline"
            className="border-[#1C1C1E] text-[#1C1C1E] hover:bg-[#1C1C1E] hover:text-white rounded-xl font-serif font-bold text-sm gap-2 h-10 px-5"
          >
            <Plus className="w-4 h-4" />
            Nova Referência
          </Button>
        </div>
      </div>
    </div>
  )
}
