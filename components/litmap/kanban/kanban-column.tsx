"use client"

import { Droppable, Draggable } from "@hello-pangea/dnd"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRightLeft, ChevronDown, CheckSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { STAGE_COLORS, STAGE_LABELS, Stage, Reference } from "@/lib/types"
import { ReferenceCard } from "./reference-card"

interface KanbanColumnProps {
  stage: Stage
  references: Reference[]
  visibleCount: number
  onLoadMore: (stage: Stage) => void
  selectionMode: boolean
  onToggleSelectionMode: () => void
  selectedIds: string[]
  slug: string
  onSelect: (id: string, selected: boolean) => void
  onDetail: (ref: Reference) => void
  onOpenPage: (id: string) => void
  onMove: (id: string, target: Stage) => void
  onQuickExclude: (id: string, cat: any, reason: string) => void
  onCustomExclude: (id: string) => void
  onDelete: (ref: Reference) => void
  onUpdateQuality: (id: string, score: number) => void
  onMarkRetracted: (ref: Reference) => void
}

export function KanbanColumn({
  stage,
  references,
  visibleCount,
  onLoadMore,
  selectionMode,
  onToggleSelectionMode,
  selectedIds,
  slug,
  onSelect,
  onDetail,
  onOpenPage,
  onMove,
  onQuickExclude,
  onCustomExclude,
  onDelete,
  onUpdateQuality,
  onMarkRetracted,
}: KanbanColumnProps) {
  const sc = STAGE_COLORS[stage]
  const list = references
  const visible = list.slice(0, visibleCount)
  const remaining = list.length - visible.length

  return (
    <div className="w-[320px] shrink-0 flex flex-col max-h-full">
      {/* Column header */}
      <div className="mb-4 px-4 py-3 rounded-xl bg-white border border-[#E5E2DA] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
            style={{ background: sc.border }}
          />
          <h3 className="font-serif text-lg text-[#2D2D2D]">{STAGE_LABELS[stage]}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSelectionMode}
            className={cn(
              "h-7 px-2 text-[10px] font-bold uppercase tracking-wider gap-1.5",
              selectionMode ? "text-[#6B8F71] bg-[#6B8F71]/10" : "text-[#A1A1AA]"
            )}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            {selectionMode ? "Selecionar" : "Bulk"}
          </Button>
          <Badge
            className="text-[11px] font-mono font-medium rounded-lg border-0"
            style={{ background: sc.bg, color: sc.text }}
          >
            {list.length}
          </Badge>
        </div>
      </div>

      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 rounded-2xl p-2 space-y-3 transition-all duration-300 min-h-[500px] overflow-y-auto custom-scrollbar",
              snapshot.isDraggingOver
                ? "bg-[#E5E2DA]/30 ring-2 ring-inset ring-[#E5E2DA]/50"
                : "bg-transparent",
            )}
          >
            {list.length === 0 && (
              <div className="text-center py-12 px-6">
                <div className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-3 border border-dashed border-[#A1A1AA]/30">
                  <ArrowRightLeft className="w-5 h-5 text-[#A1A1AA]/40" />
                </div>
                <p className="text-xs text-[#A1A1AA] italic leading-relaxed">
                  Arraste artigos para esta fase para avançar no seu mapeamento sistemático.
                </p>
              </div>
            )}

            {visible.map((r, idx) => (
              <Draggable key={r.id} draggableId={r.id} index={idx}>
                {(p, snap) => (
                  <div
                    ref={p.innerRef}
                    {...p.draggableProps}
                    {...p.dragHandleProps}
                  >
                    <ReferenceCard
                      reference={r}
                      slug={slug}
                      isDragging={snap.isDragging}
                      isSelected={selectedIds.includes(r.id)}
                      onSelect={onSelect}
                      onDetail={onDetail}
                      onOpenPage={onOpenPage}
                      onMove={onMove}
                      onQuickExclude={onQuickExclude}
                      onCustomExclude={onCustomExclude}
                      onDelete={onDelete}
                      onUpdateQuality={onUpdateQuality}
                      onMarkRetracted={onMarkRetracted}
                    />
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}

            {remaining > 0 && (
              <button
                onClick={() => onLoadMore(stage)}
                className="w-full mt-2 py-2.5 px-4 rounded-xl border border-dashed border-[#C8C2BB] text-[11px] font-bold text-[#A1A1AA] hover:bg-white hover:text-[#5F5E60] hover:border-[#A1A1AA] transition-all flex items-center justify-center gap-2"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                Carregar mais ({remaining} restantes)
              </button>
            )}

            {list.length > visibleCount && (
              <div className="text-center text-[10px] text-[#A1A1AA] pt-1">
                A mostrar {Math.min(visible.length, list.length)} de {list.length}
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
