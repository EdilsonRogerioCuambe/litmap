import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "border-b border-[#e2ddd8] bg-[#f7f4ef] px-8 py-6 flex flex-wrap items-end justify-between gap-4 sticky top-0 z-30 backdrop-blur",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-serif text-3xl leading-tight text-[#18181b] text-balance">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[#5c5955] mt-1.5 leading-relaxed text-pretty">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

export function StageBadge({
  stage,
  className,
}: {
  stage: "identification" | "screening" | "eligibility" | "included" | "excluded"
  className?: string
}) {
  const map = {
    identification: { label: "Identificação", bg: "#E8EFF8", text: "#3A6FA8" },
    screening: { label: "Triagem", bg: "#FDF3E7", text: "#C4914A" },
    eligibility: { label: "Elegibilidade", bg: "#EAF1ED", text: "#5C7E6B" },
    included: { label: "Incluído", bg: "#E8F5EE", text: "#2E7D52" },
    excluded: { label: "Excluído", bg: "#FDEAEA", text: "#B94040" },
  }
  const s = map[stage]
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-sans whitespace-nowrap",
        className,
      )}
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}
