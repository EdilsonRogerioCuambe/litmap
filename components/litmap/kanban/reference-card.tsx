"use client"

import { useState } from "react"
import {
  MoreHorizontal, Eye, ExternalLink, ArrowRightLeft, X, Trash2,
  Star, FileWarning
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Reference, Stage, ExclusionCategory } from "@/lib/types"
import { STAGE_COLORS, STAGE_LABELS, STAGES } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ReferenceCardProps {
  reference: Reference
  slug: string
  isDragging?: boolean
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  onDetail?: (ref: Reference) => void
  onOpenPage?: (id: string) => void
  onMove?: (id: string, target: Stage) => void
  onQuickExclude?: (id: string, cat: ExclusionCategory, reason: string) => void
  onCustomExclude?: (id: string) => void
  onDelete?: (ref: Reference) => void
  onUpdateQuality?: (id: string, score: number) => void
  onMarkRetracted?: (ref: Reference) => void
}

export function ReferenceCard({
  reference,
  slug,
  isDragging,
  isSelected,
  onSelect,
  onDetail,
  onOpenPage,
  onMove,
  onQuickExclude,
  onCustomExclude,
  onDelete,
  onUpdateQuality,
  onMarkRetracted,
}: ReferenceCardProps) {
  const r = reference
  const sc = STAGE_COLORS[r.stage]
  const isRetracted = r.exclusionCategory === "Artigo Retratado"

  // Metadata quality indicator
  const importantFields = ["title", "authors", "year", "abstractNote", "doi"]
  const missingFields = importantFields.filter((f) => {
    if (f === "authors") return !r.authors || r.authors.length === 0
    return !r[f as keyof Reference]
  })

  const qualityColor =
    missingFields.length === 0
      ? "bg-green-500"
      : missingFields.length <= 2
      ? "bg-amber-500"
      : "bg-red-500"

  const qualityLabel =
    missingFields.length === 0
      ? "Metadados Completos"
      : `Faltam: ${missingFields
          .map((f) =>
            f === "abstractNote"
              ? "Abstract"
              : f.charAt(0).toUpperCase() + f.slice(1)
          )
          .join(", ")}`

  return (
    <div
      className={cn(
        "group bg-white rounded-2xl p-4 cursor-grab active:cursor-grabbing transition-all duration-200 border border-transparent border-l-[4px] relative",
        isDragging
          ? "shadow-[0_20px_50px_rgba(0,0,0,0.15)] scale-[1.02]"
          : "shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]",
        r.stage === "excluded" && "opacity-80 hover:opacity-100",
        isSelected && "ring-2 ring-[#6B8F71] ring-offset-2",
        isRetracted && "border-l-red-500"
      )}
      style={{ borderLeftColor: isRetracted ? "#EF4444" : sc.border }}
    >
      {/* Retracted banner */}
      {isRetracted && (
        <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 bg-red-50 rounded-lg border border-red-100">
          <FileWarning className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
            Artigo Retratado
          </span>
        </div>
      )}

      {/* Multi-select checkbox */}
      <div
        className={cn(
          "absolute top-3 left-3 z-10 transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect?.(r.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-[#E5E2DA] text-[#6B8F71] focus:ring-[#6B8F71] cursor-pointer"
        />
      </div>

      {/* Top row */}
      <div className="flex justify-between items-start gap-2 mb-2 ml-6">
        <Stars
          value={r.qualityScore || 0}
          onChange={(v) => onUpdateQuality?.(r.id, v)}
        />
        <div className="flex items-center gap-1.5">
          {/* Metadata quality dot */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("w-2 h-2 rounded-full", qualityColor)} />
              </TooltipTrigger>
              <TooltipContent className="bg-[#1C1C1E] text-white border-none text-[10px] py-1 px-2 rounded-lg">
                {qualityLabel}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {r.database && (
            <span className="text-[9px] uppercase tracking-widest font-bold text-[#A1A1AA] bg-[#FAF9F6] px-1.5 py-0.5 rounded border border-[#E5E2DA]">
              {r.database}
            </span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-[#A1A1AA] hover:text-[#1C1C1E] hover:bg-[#F5F2ED] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 rounded-xl shadow-xl border-[#E5E2DA]"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem className="gap-2 text-xs" onClick={() => onDetail?.(r)}>
                <Eye className="w-3.5 h-3.5" /> Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-xs" onClick={() => onOpenPage?.(r.id)}>
                <ExternalLink className="w-3.5 h-3.5" /> Abrir página completa
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2 text-xs">
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Mover para...
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="rounded-xl border-[#E5E2DA]">
                  {STAGES.filter((s) => s !== r.stage).map((s) => (
                    <DropdownMenuItem
                      key={s}
                      className="gap-2 text-xs"
                      onClick={() => onMove?.(r.id, s)}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: STAGE_COLORS[s].border }}
                      />
                      {STAGE_LABELS[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {r.stage !== "excluded" && (
                <>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2 text-xs text-[#B94040] focus:text-[#B94040]">
                      <X className="w-3.5 h-3.5" /> Excluir rapidamente
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="rounded-xl border-[#E5E2DA] w-52">
                      {[
                        { cat: "Duplicado", reason: "Identificado como duplicado na triagem rápida." },
                        { cat: "Tese/Dissertação", reason: "Trabalho académico (tese/dissertação) fora do escopo." },
                        { cat: "Capítulo de Livro", reason: "Capítulo de livro fora do escopo." },
                        { cat: "Livro", reason: "Livro (monografia) fora do escopo." },
                        { cat: "Remoção por Título", reason: "Título não relacionado com o tema." },
                      ].map(({ cat, reason }) => (
                        <DropdownMenuItem
                          key={cat}
                          className="text-xs"
                          onClick={() =>
                            onQuickExclude?.(r.id, cat as ExclusionCategory, reason)
                          }
                        >
                          {cat}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-xs font-semibold"
                        onClick={() => onCustomExclude?.(r.id)}
                      >
                        Outro motivo...
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuItem
                    className="gap-2 text-xs text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={() => onMarkRetracted?.(r)}
                  >
                    <FileWarning className="w-3.5 h-3.5" /> Marcar como Retratado
                  </DropdownMenuItem>
                </>
              )}

              {r.stage === "excluded" && !isRetracted && (
                <DropdownMenuItem
                  className="gap-2 text-xs text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={() => onMarkRetracted?.(r)}
                >
                  <FileWarning className="w-3.5 h-3.5" /> Marcar como Retratado
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/5"
                onClick={() => onDelete?.(r)}
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar permanentemente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Card content */}
      <button className="text-left w-full group/btn ml-1" onClick={() => onDetail?.(r)}>
        <h4 className="font-serif text-[15px] leading-snug text-[#2D2D2D] mb-2 group-hover/btn:text-primary transition-colors line-clamp-3">
          {r.title}
        </h4>
        <div className="flex items-center gap-2 text-[11px] text-[#71717A] mb-1">
          <span className="font-medium text-[#444444]">
            {formatAuthors(r.authors)}
          </span>
          {r.year && (
            <>
              <span className="w-1 h-1 rounded-full bg-[#E5E2DA]" />
              <span>{r.year}</span>
            </>
          )}
        </div>
        {r.journal && (
          <div className="text-[10px] italic text-[#A1A1AA] line-clamp-1">
            {r.journal}
          </div>
        )}
      </button>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#FAF9F6] flex-wrap">
        {r.type && (
          <Badge
            variant="outline"
            className="text-[9px] py-0 px-1.5 h-5 bg-[#FAF9F6] border-[#E5E2DA] text-[#71717A] font-normal"
          >
            {r.type}
          </Badge>
        )}

        {r.stage === "excluded" && r.exclusionCategory && !isRetracted && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#FFF1F1] rounded-md border border-[#FEE2E2]">
            <div className="w-1 h-3 rounded-full bg-[#EF4444]" />
            <span className="text-[9px] font-bold text-[#991B1B] uppercase tracking-tight">
              {r.exclusionCategory}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function formatAuthors(authors: string[]): string {
  if (!authors || authors.length === 0) return "—"
  if (authors.length === 1) return authors[0]
  if (authors.length === 2) return `${authors[0]}, ${authors[1]}`
  return `${authors[0]} et al.`
}

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5 mt-1.5" aria-label="Pontuação de qualidade">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={(e) => {
            e.stopPropagation()
            onChange(value === n ? 0 : n)
          }}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "w-3 h-3 transition-colors",
              n <= value ? "fill-[#c4914a] text-[#c4914a]" : "text-[#c8c2bb]"
            )}
          />
        </button>
      ))}
    </div>
  )
}
