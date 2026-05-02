"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { ExclusionCategory } from "@/lib/types"

const CATEGORY_GROUPS: { group: string; items: { value: ExclusionCategory; label: string; suggestion: string }[] }[] = [
  {
    group: "Triagem por Leitura",
    items: [
      { value: "Remoção por Título", label: "Remoção por Título", suggestion: "Título não relacionado com o tema da revisão." },
      { value: "Remoção por Resumo/Abstract", label: "Remoção por Resumo/Abstract", suggestion: "Resumo não satisfaz os critérios de inclusão." },
      { value: "Artigo Retratado", label: "Artigo Retratado", suggestion: "Artigo formalmente retratado pelo editor ou autores." },
      { value: "Duplicado", label: "Duplicado", suggestion: "Duplicado de outro registo já presente na base de dados." },
    ],
  },
  {
    group: "Tipo de Publicação",
    items: [
      { value: "Capítulo de Livro", label: "Capítulo de Livro", suggestion: "Publicação do tipo capítulo de livro, fora do escopo." },
      { value: "Livro", label: "Livro", suggestion: "Publicação do tipo livro (monografia), fora do escopo." },
      { value: "Tese/Dissertação", label: "Tese/Dissertação", suggestion: "Tese ou dissertação, fora do escopo definido." },
      { value: "Relatório/Técnico", label: "Relatório Técnico", suggestion: "Relatório técnico ou grey literature, fora do escopo." },
      { value: "Tipo de Publicação", label: "Outro Tipo de Publicação", suggestion: "Tipo de publicação fora do escopo (ex.: editorial, opinião)." },
    ],
  },
  {
    group: "Critérios Metodológicos",
    items: [
      { value: "Critério de Inclusão", label: "Critério de Inclusão", suggestion: "Não cumpre os critérios de inclusão definidos." },
      { value: "Metodologia", label: "Metodologia", suggestion: "Metodologia inadequada ao escopo da revisão." },
      { value: "População", label: "População", suggestion: "População fora do escopo (ex.: faixa etária, contexto)." },
      { value: "Período", label: "Período", suggestion: "Publicação fora do período temporal definido." },
      { value: "Sem Texto Completo", label: "Sem Texto Completo", suggestion: "Texto completo indisponível para avaliação." },
      { value: "Idioma", label: "Idioma", suggestion: "Publicação em idioma fora dos critérios definidos." },
    ],
  },
  {
    group: "Outro",
    items: [
      { value: "Outro", label: "Outro (especificar abaixo)", suggestion: "" },
    ],
  },
]

const ALL_ITEMS = CATEGORY_GROUPS.flatMap(g => g.items)

export function ExclusionModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  defaultCategory,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (category: ExclusionCategory, reason: string) => void
  onCancel?: () => void
  defaultCategory?: ExclusionCategory
}) {
  const [category, setCategory] = useState<ExclusionCategory>(defaultCategory ?? "Remoção por Título")
  const [customCategory, setCustomCategory] = useState("")
  const [reason, setReason] = useState("")

  useEffect(() => {
    if (open) {
      const cat = defaultCategory ?? "Remoção por Título"
      setCategory(cat)
      setCustomCategory("")
      const found = ALL_ITEMS.find(i => i.value === cat)
      setReason(found?.suggestion ?? "")
    }
  }, [open, defaultCategory])

  const handleCategoryChange = (val: string) => {
    setCategory(val as ExclusionCategory)
    const found = ALL_ITEMS.find(i => i.value === val)
    setReason(found?.suggestion ?? "")
    if (val !== "Outro") setCustomCategory("")
  }

  const finalCategory = category === "Outro" && customCategory.trim()
    ? customCategory.trim() as ExclusionCategory
    : category

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && onCancel) onCancel()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Motivo de Exclusão</DialogTitle>
          <DialogDescription>
            Regista o motivo — aparecerá documentado no fluxograma PRISMA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Categoria de exclusão</Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="border-[#e2ddd8] focus:ring-sage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {CATEGORY_GROUPS.map(g => (
                  <SelectGroup key={g.group}>
                    <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-outline px-2 py-1">
                      {g.group}
                    </SelectLabel>
                    {g.items.map(item => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {category === "Outro" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Categoria personalizada</Label>
              <Input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Ex: Fora do âmbito temático, Sem dados empíricos..."
                className="border-[#e2ddd8] focus-visible:ring-sage"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Justificação detalhada</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo específico para esta exclusão..."
              className="border-[#e2ddd8] focus-visible:ring-sage"
            />
          </div>

          {/* Quick hint */}
          <div className="bg-surface-container-low rounded-lg p-3 text-xs text-on-surface-variant border border-bone">
            <span className="font-semibold text-ink">💡 Dica: </span>
            Pode também excluir diretamente pelo cartão no Kanban clicando no ícone de exclusão rápida.
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onCancel?.()
              onOpenChange(false)
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onConfirm(finalCategory, reason)
              onOpenChange(false)
            }}
            style={{ background: "var(--danger)" }}
            className="text-white hover:opacity-90"
          >
            Confirmar exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
