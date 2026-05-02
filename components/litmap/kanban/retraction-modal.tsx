"use client"

import { useState } from "react"
import { AlertTriangle, X, ExternalLink, Calendar, FileWarning } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export interface RetractionInfo {
  retractionDate: string
  retractionUrl: string
  retractionReason: string
}

interface RetractionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  referenceTitle: string
  onConfirm: (info: RetractionInfo) => void
}

export function RetractionModal({
  open,
  onOpenChange,
  referenceTitle,
  onConfirm,
}: RetractionModalProps) {
  const [retractionDate, setRetractionDate] = useState("")
  const [retractionUrl, setRetractionUrl] = useState("")
  const [retractionReason, setRetractionReason] = useState("")

  const handleConfirm = () => {
    onConfirm({ retractionDate, retractionUrl, retractionReason })
    onOpenChange(false)
    // Reset
    setRetractionDate("")
    setRetractionUrl("")
    setRetractionReason("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <FileWarning className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl">
                Marcar como Retratado
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Registe as informações da retratação para o relatório PRISMA.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Reference title preview */}
        <div className="bg-[#FFF8F1] border border-orange-200 rounded-xl px-4 py-3 mb-2">
          <p className="text-[10px] uppercase tracking-widest font-bold text-orange-500 mb-1">
            Artigo
          </p>
          <p className="font-serif text-sm font-bold text-[#1C1C1E] line-clamp-2">
            {referenceTitle}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Data de Retratação
            </Label>
            <Input
              type="date"
              value={retractionDate}
              onChange={(e) => setRetractionDate(e.target.value)}
              className="border-[#E5E2DA] focus-visible:ring-[#6B8F71]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              URL da Notificação de Retratação
            </Label>
            <Input
              value={retractionUrl}
              onChange={(e) => setRetractionUrl(e.target.value)}
              placeholder="https://doi.org/10.xxxx/retraction..."
              className="border-[#E5E2DA] focus-visible:ring-[#6B8F71] font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              Motivo da Retratação
            </Label>
            <Input
              value={retractionReason}
              onChange={(e) => setRetractionReason(e.target.value)}
              placeholder="Ex: Fraude científica, erro metodológico, dados fabricados..."
              className="border-[#E5E2DA] focus-visible:ring-[#6B8F71]"
            />
          </div>

          <div className="bg-[#FFF1F1] border border-red-100 rounded-xl p-3 text-xs text-[#991B1B]">
            <span className="font-bold">⚠️ Atenção: </span>
            Esta referência será excluída com a categoria "Artigo Retratado" e as informações
            de retratação serão armazenadas para documentação no fluxograma PRISMA.
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-[#B94040] hover:bg-[#a03030] text-white rounded-xl gap-2 font-bold"
          >
            <FileWarning className="w-4 h-4" />
            Confirmar Retratação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
