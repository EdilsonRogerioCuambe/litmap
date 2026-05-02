"use client"

import { cn } from "@/lib/utils"
import { STAGE_LABELS, Stage } from "@/lib/types"

interface StageProgress {
  stage: Stage
  entered: number
  left: number
  percentage: number
}

interface ScreeningProgressBarProps {
  stats: StageProgress[]
}

export function ScreeningProgressBar({ stats }: ScreeningProgressBarProps) {
  return (
    <div className="px-8 py-6 bg-white border-b border-[#E5E2DA] flex items-center justify-between gap-4 overflow-x-auto">
      {stats.map((s, idx) => {
        const isCompleted = s.percentage >= 80
        const isStarted = s.percentage > 0
        
        return (
          <div key={s.stage} className="flex-1 min-w-[180px] group">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors",
                isCompleted 
                  ? "bg-[#6B8F71] text-white border-[#6B8F71]" 
                  : isStarted 
                    ? "bg-amber-50 text-amber-600 border-amber-200" 
                    : "bg-[#FAF9F6] text-[#A1A1AA] border-[#E5E2DA]"
              )}>
                {idx + 1}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#1C1C1E]">
                  {STAGE_LABELS[s.stage]}
                </span>
                <span className="text-[10px] text-[#A1A1AA] font-mono">
                  {s.entered} entraram → {s.left} triados
                </span>
              </div>
            </div>

            <div className="relative h-2 w-full bg-[#FAF9F6] rounded-full overflow-hidden border border-[#E5E2DA]/50">
              <div
                className={cn(
                  "h-full transition-all duration-1000 ease-out",
                  isCompleted ? "bg-[#6B8F71]" : "bg-amber-400"
                )}
                style={{ width: `${s.percentage}%` }}
              />
            </div>
            
            <div className="mt-1 flex justify-between items-center">
              <span className={cn(
                "text-[10px] font-bold font-mono",
                isCompleted ? "text-[#6B8F71]" : isStarted ? "text-amber-600" : "text-[#A1A1AA]"
              )}>
                {s.percentage}% triado
              </span>
              {idx < stats.length - 1 && (
                <div className="h-px w-8 bg-[#E5E2DA] group-last:hidden" />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
