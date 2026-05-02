"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, X, Copy, Check, AlertTriangle, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import type { Reference } from "@/lib/types"
import { moveReferenceAction } from "@/lib/actions/reference"
import { toast } from "sonner"

interface DuplicateFinderModalProps {
  onClose: () => void
  slug: string
}

export function DuplicateFinderModal({ onClose, slug }: DuplicateFinderModalProps) {
  const { state, moveReference } = useStore()
  const [search, setSearch] = useState("")
  
  // Manual selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [keepId, setKeepId] = useState<string | null>(null)
  
  const [processing, setProcessing] = useState(false)
  const [progressState, setProgressState] = useState<{ current: number, total: number } | null>(null)

  // Only look in non-excluded stages to prevent duplicating already excluded items
  const candidates = useMemo(() => {
    return state.references.filter((r) => r.stage !== "excluded")
  }, [state.references])

  // Exact Match Grouping (Zotero-style)
  const exactGroups = useMemo(() => {
    const groups: Record<string, Reference[]> = {}
    
    candidates.forEach((r) => {
      // Normalize title by removing punctuation/spaces for a robust exact match
      const titleKey = r.title.toLowerCase().trim().replace(/[^\w]/g, "")
      const doiKey = r.doi ? r.doi.toLowerCase().trim() : null
      
      // Group by DOI if it exists, otherwise by Title
      const key = doiKey ? `doi:${doiKey}` : `title:${titleKey}`
      
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    })
    
    // Only return groups that have 2 or more items
    return Object.values(groups).filter((g) => g.length >= 2)
  }, [candidates])

  // Filter candidates based on search
  const filteredCandidates = useMemo(() => {
    if (!search.trim()) return candidates
    
    const q = search.toLowerCase()
    
    return candidates.filter((r) => {
      const titleMatch = r.title.toLowerCase().includes(q)
      const authorsMatch = r.authors.join(" ").toLowerCase().includes(q)
      const doiMatch = r.doi?.toLowerCase().includes(q)
      const abstractMatch = r.abstractNote?.toLowerCase().includes(q)
      
      return titleMatch || authorsMatch || doiMatch || abstractMatch
    })
  }, [candidates, search])

  // Default to first selected as keepId if none is set
  useEffect(() => {
    if (selectedIds.size > 0 && (!keepId || !selectedIds.has(keepId))) {
      setKeepId(Array.from(selectedIds)[0])
    } else if (selectedIds.size === 0) {
      setKeepId(null)
    }
  }, [selectedIds, keepId])

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const selectGroup = (group: Reference[]) => {
    setSelectedIds(new Set(group.map(r => r.id)))
  }

  const handleMerge = async () => {
    if (selectedIds.size < 2 || !keepId) return

    const toExcludeIds = Array.from(selectedIds).filter((id) => id !== keepId)
    const toExcludeRefs = candidates.filter((r) => toExcludeIds.includes(r.id))

    setProcessing(true)
    const toastId = toast.loading(`A excluir ${toExcludeIds.length} duplicado(s)...`)

    try {
      await Promise.all(
        toExcludeRefs.map((r) =>
          moveReferenceAction(slug, r.id, "excluded", {
            exclusionCategory: "Duplicado",
            exclusionReason: "Marcado manualmente como duplicado.",
          })
        )
      )
      
      // Update local store
      toExcludeRefs.forEach((r) =>
        moveReference(r.id, "excluded", {
          exclusionCategory: "Duplicado",
          exclusionReason: "Marcado manualmente como duplicado.",
        })
      )

      toast.success(`${toExcludeIds.length} duplicado(s) resolvido(s).`, { id: toastId })
      
      // Clear selection after success
      setSelectedIds(new Set())
      setKeepId(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      toast.error("Erro: " + message, { id: toastId })
    } finally {
      setProcessing(false)
    }
  }

  const handleMergeAll = async () => {
    if (exactGroups.length === 0) return

    setProcessing(true)
    const toastId = toast.loading(`A resolver ${exactGroups.length} grupo(s) de duplicados...`)

    try {
      const getKeeper = (group: Reference[]) => {
        return group.reduce((best, current) => {
          const score = (r: Reference) => (r.doi ? 1 : 0) + (r.abstractNote ? 1 : 0) + (r.year ? 1 : 0)
          return score(current) > score(best) ? current : best
        }, group[0])
      }

      const allToExclude = exactGroups.flatMap((group) => {
        const keeper = getKeeper(group)
        return group.filter((r) => r.id !== keeper.id)
      })

      setProgressState({ current: 0, total: allToExclude.length })

      // Process in chunks of 5 to allow progress UI to update and avoid overwhelming the server
      const chunkSize = 5
      let completed = 0

      for (let i = 0; i < allToExclude.length; i += chunkSize) {
        const chunk = allToExclude.slice(i, i + chunkSize)
        await Promise.all(
          chunk.map((r) =>
            moveReferenceAction(slug, r.id, "excluded", {
              exclusionCategory: "Duplicado",
              exclusionReason: "Marcado automaticamente (Resolver Todos).",
            })
          )
        )
        completed += chunk.length
        setProgressState({ current: completed, total: allToExclude.length })
      }

      allToExclude.forEach((r) =>
        moveReference(r.id, "excluded", {
          exclusionCategory: "Duplicado",
          exclusionReason: "Marcado automaticamente (Resolver Todos).",
        })
      )

      toast.success(`${allToExclude.length} duplicado(s) resolvidos automaticamente!`, { id: toastId })

      setSelectedIds(new Set())
      setKeepId(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      toast.error("Erro ao resolver todos: " + message, { id: toastId })
    } finally {
      setProcessing(false)
      setProgressState(null)
    }
  }

  const isSearchActive = search.trim().length > 0

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 lg:pl-64">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#E5E2DA] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Copy className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-[#1C1C1E] flex items-center gap-2">
                  Gestor de Duplicados
                  {exactGroups.length > 0 && !isSearchActive && (
                    <Badge className="bg-amber-100 text-amber-800 border-none">
                      {exactGroups.length} sugestões
                    </Badge>
                  )}
                </h2>
                <p className="text-xs text-[#A1A1AA]">
                  Identifica e mescla referências idênticas (Zotero-style).
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-[#FAF8F4] shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-8 py-4 border-b border-[#E5E2DA] bg-[#FAF9F6]">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por título, autor, DOI para seleção manual..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E2DA] rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Main Layout: Results & Resolution Panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Results List */}
          <div className="flex-1 overflow-y-auto px-6 py-6 border-r border-[#E5E2DA] bg-[#FAF9F6]">
            {!isSearchActive && exactGroups.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-[#E5E2DA]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-[#6B8F71]" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1C1C1E] mb-1">
                  Sem sugestões automáticas
                </h3>
                <p className="text-sm text-[#A1A1AA]">
                  Não encontrámos itens com o mesmo título ou DOI.<br/>Usa a barra de pesquisa para procurares manualmente.
                </p>
              </div>
            )}

            {!isSearchActive && exactGroups.length > 0 && (
              <div className="space-y-4">
                {progressState && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                    <div className="flex justify-between text-xs font-bold text-amber-800 mb-2">
                      <span>A resolver duplicados...</span>
                      <span>{progressState.current} de {progressState.total}</span>
                    </div>
                    <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-amber-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.round((progressState.current / progressState.total) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mb-2 px-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1C1C1E]">
                    <Layers className="w-4 h-4 text-amber-500" />
                    Sugestões Automáticas
                  </div>
                  <Button
                    onClick={handleMergeAll}
                    disabled={processing}
                    variant="outline"
                    className="h-8 text-xs font-bold border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 disabled:opacity-50"
                  >
                    {processing ? "A resolver..." : `Resolver Todos (${exactGroups.length} grupos)`}
                  </Button>
                </div>
                {exactGroups.map((group, idx) => {
                  const isSelected = selectedIds.has(group[0].id) // if one is selected, assume group is active

                  return (
                    <div
                      key={idx}
                      onClick={() => selectGroup(group)}
                      className={cn(
                        "rounded-xl border p-4 cursor-pointer transition-all flex flex-col gap-2",
                        isSelected
                          ? "border-amber-400 bg-amber-50/50 shadow-sm"
                          : "border-[#E5E2DA] bg-white hover:border-amber-300"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-serif font-bold text-sm text-[#1C1C1E] leading-snug line-clamp-2">
                          {group[0].title}
                        </p>
                        <Badge className="bg-amber-100 text-amber-700 border-none ml-3 shrink-0">
                          {group.length} cópias
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.map((r, i) => (
                          <span key={r.id} className="text-[10px] bg-[#FAF9F6] border border-[#E5E2DA] px-2 py-0.5 rounded text-[#A1A1AA]">
                            {r.stage}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {isSearchActive && filteredCandidates.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-[#E5E2DA]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-[#A1A1AA]" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1C1C1E] mb-1">
                  Nenhum artigo encontrado
                </h3>
                <p className="text-sm text-[#A1A1AA]">
                  Tenta pesquisar por outras palavras-chave ou DOI.
                </p>
              </div>
            )}

            {isSearchActive && filteredCandidates.length > 0 && (
              <div className="space-y-3">
                {filteredCandidates.map((ref) => {
                  const isSelected = selectedIds.has(ref.id)
                  
                  return (
                    <div
                      key={ref.id}
                      onClick={() => toggleSelection(ref.id)}
                      className={cn(
                        "rounded-xl border p-4 cursor-pointer transition-all flex items-start gap-3",
                        isSelected
                          ? "border-amber-400 bg-amber-50/50 shadow-sm"
                          : "border-[#E5E2DA] bg-white hover:border-amber-300"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors border",
                          isSelected
                            ? "bg-amber-500 border-amber-500"
                            : "bg-white border-[#C8C2BB]"
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-serif font-bold text-sm text-[#1C1C1E] leading-snug">
                          {ref.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {ref.authors && ref.authors.length > 0 && (
                            <span className="text-xs text-[#5C5955]">
                              {ref.authors[0]}{ref.authors.length > 1 ? " et al." : ""}
                            </span>
                          )}
                          {ref.year && (
                            <span className="text-xs font-mono text-[#A1A1AA]">
                              {ref.year}
                            </span>
                          )}
                          <Badge
                            className="text-[9px] py-0 px-1.5 border-none"
                            style={{
                              background:
                                ref.stage === "identification"
                                  ? "#E8EFF8"
                                  : ref.stage === "screening" ? "#FDF3E7" : "#E8F5EE",
                              color:
                                ref.stage === "identification"
                                  ? "#3A6FA8"
                                  : ref.stage === "screening" ? "#C4914A" : "#2E7D52",
                            }}
                          >
                            {ref.stage.charAt(0).toUpperCase() + ref.stage.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Resolution Side Panel (shows when selected >= 1) */}
          <div className="w-[380px] flex flex-col bg-white">
            <div className="p-6 border-b border-[#E5E2DA]">
              <h3 className="font-serif font-bold text-lg text-[#1C1C1E] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Resolução ({selectedIds.size} selecionados)
              </h3>
              <p className="text-xs text-[#5C5955] mt-1 leading-relaxed">
                Seleciona 2 ou mais artigos para os mesclar. Escolhe qual deles é a versão mais completa para <strong>Manter</strong>.
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {selectedIds.size === 0 && (
                <p className="text-sm text-[#A1A1AA] text-center italic mt-10">
                  Nenhum artigo selecionado.
                </p>
              )}
              
              {Array.from(selectedIds).map((id) => {
                const ref = state.references.find(r => r.id === id)
                if (!ref) return null
                
                const isKeeper = keepId === id
                
                return (
                  <div
                    key={id}
                    onClick={() => setKeepId(id)}
                    className={cn(
                      "p-3 rounded-xl border-2 cursor-pointer transition-all",
                      isKeeper
                        ? "border-[#6B8F71] bg-[#6B8F71]/5"
                        : "border-[#E5E2DA] hover:border-[#6B8F71]/40"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-colors",
                        isKeeper ? "border-[#6B8F71] bg-[#6B8F71]" : "border-[#C8C2BB] bg-white"
                      )}>
                        {isKeeper && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-[#1C1C1E] line-clamp-2">
                          {ref.title}
                        </span>
                        {isKeeper ? (
                          <Badge className="mt-2 bg-[#E8F5EE] text-[#2E7D52] border-none text-[9px] hover:bg-[#E8F5EE]">
                            Vai ser Mantido
                          </Badge>
                        ) : (
                          <Badge className="mt-2 bg-red-50 text-red-600 border-none text-[9px] hover:bg-red-50">
                            Será marcado como Duplicado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Action Footer */}
            <div className="p-6 border-t border-[#E5E2DA] bg-[#FAF9F6]">
              <Button
                onClick={handleMerge}
                disabled={selectedIds.size < 2 || processing}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 rounded-xl"
              >
                {processing ? "A processar..." : "Mesclar (Manter Principal)"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
