"use client"

import { useStore } from "@/lib/store"
import { useParams } from "next/navigation"
import { PageHeader } from "../page-header"
import { Button } from "@/components/ui/button"
import { UserPlus, CheckCircle, XCircle, Users, Shield, MessageSquare, AlertTriangle, TrendingUp, Mail, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useMemo } from "react"

export function TeamView() {
  const { state } = useStore()
  const params = useParams()
  const slug = params.slug as string
  const currentProject = state.project

  const members = useMemo(() => {
    return (currentProject as any)?.members || []
  }, [currentProject])

  return (
    <div className="flex flex-col min-h-full bg-[#FAF8F4]">
      <PageHeader
        title="Equipa & Colaboração"
        subtitle="Coordene a sua equipa de investigação, gira permissões e resolva conflitos de triagem."
        actions={
          <Button
            className="bg-[#1C1C1E] hover:bg-black text-white gap-2 shadow-md shadow-black/10 px-6"
          >
            <UserPlus className="w-4 h-4" /> Convidar Membro
          </Button>
        }
      />

      <div className="p-4 lg:p-8 space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Members List */}
          <section className="xl:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-[#E5E2DA] shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-[#E5E2DA] flex justify-between items-center">
                <h2 className="font-serif text-xl font-bold text-[#1C1C1E] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#6B8F71]" />
                  Investigadores
                </h2>
                <Badge variant="secondary" className="bg-[#FAF8F4] text-[#5F5E60] border-[#E5E2DA]">
                  {members.length} membros
                </Badge>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <ul className="divide-y divide-[#E5E2DA]">
                  {members.map((m: any, idx: number) => (
                    <li key={idx} className="p-4 hover:bg-[#FAF8F4]/50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {m.user?.image ? (
                            <img src={m.user.image} alt={m.user.name} className="w-10 h-10 rounded-full object-cover border border-[#E5E2DA]" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#5c7e6b]/10 text-[#5c7e6b] flex items-center justify-center font-serif font-bold">
                              {m.user?.name?.charAt(0) || "U"}
                            </div>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#1C1C1E] truncate">{m.user?.name || "Utilizador"}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#A1A1AA] font-mono mt-0.5">
                            <Mail className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[120px]">{m.user?.email || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                          m.role === "OWNER" ? "bg-[#1C1C1E] text-white" : "bg-[#FAF8F4] border border-[#E5E2DA] text-[#5F5E60]"
                        )}>
                          {m.role === "OWNER" ? "Admin" : "Revisor"}
                        </span>
                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#E5E2DA]/50 rounded transition-all">
                          <MoreHorizontal className="w-4 h-4 text-[#A1A1AA]" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="p-4 bg-[#FAF8F4] border-t border-[#E5E2DA]">
                <button className="w-full py-2 text-xs font-bold text-[#6B8F71] hover:text-[#5c7e6b] transition-colors flex items-center justify-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  Gerir Permissões de Acesso
                </button>
              </div>
            </div>
          </section>

          {/* Conflict & Activity Stats */}
          <section className="xl:col-span-8 space-y-8">
            
            {/* Conflict Management Card */}
            <div className="bg-white rounded-xl border border-[#E5E2DA] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#E5E2DA] flex justify-between items-center bg-white sticky top-0">
                <div className="flex flex-col">
                  <h2 className="font-serif text-xl font-bold text-[#1C1C1E] flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />
                    Gestão de Conflitos
                  </h2>
                  <p className="text-xs text-[#A1A1AA] mt-1 uppercase tracking-wider font-mono">Divergências na triagem independente (Cego)</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-[#ba1a1a]/10 text-[#ba1a1a] rounded-full text-[10px] font-bold font-mono">
                    2 CONFLITOS PENDENTES
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#FAF8F4] border-b border-[#E5E2DA]">
                      <th className="p-4 font-serif text-[11px] font-bold uppercase tracking-wider text-[#5F5E60]">Referência</th>
                      <th className="p-4 font-serif text-[11px] font-bold uppercase tracking-wider text-[#5F5E60] text-center">Revisor A</th>
                      <th className="p-4 font-serif text-[11px] font-bold uppercase tracking-wider text-[#5F5E60] text-center">Revisor B</th>
                      <th className="p-4 w-32"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E2DA]">
                    <ConflictRow 
                      title="Machine learning in early cancer detection..." 
                      authors="Smith et al. (2023)"
                      revA={{ name: "AS", decision: "included" }}
                      revB={{ name: "CM", decision: "excluded" }}
                    />
                    <ConflictRow 
                      title="Deep neural networks for medical imaging..." 
                      authors="Chen, L. (2022)"
                      revA={{ name: "AS", decision: "excluded" }}
                      revB={{ name: "MR", decision: "included" }}
                    />
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 text-center border-t border-[#E5E2DA]">
                <button className="text-xs font-bold text-[#5F5E60] hover:text-[#1C1C1E] transition-colors underline underline-offset-4">
                  Exportar Relatório de Discordâncias
                </button>
              </div>
            </div>

            {/* Individual Progress Cards */}
            <div className="bg-white rounded-xl border border-[#E5E2DA] shadow-sm p-6">
              <h2 className="font-serif text-xl font-bold text-[#1C1C1E] mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#6B8F71]" />
                Produtividade da Equipa
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ProgressCard name="Dra. Ana Silva" progress={90} count="450/500" image="https://lh3.googleusercontent.com/aida-public/AB6AXuD_R2eLftTrdb8Ny1E8jMK64P5FJiRaNcrx6BZRaZh6IqugtCQidOiXqV8mgzy4Fj1qR9aB6Czd0hPY9TPAf83w8bW-QbIiSr3uOaJKDnHid06oE7FbPH_gxnzpRCFU9PG4YEnDtPTdymYv3bh15Dx0Pv4jht3Q-L97DEoeUn2N6ZAGL_uTcSLZLaiVp88M_2A-2ZtBXattaVBVnkG4VDbuGeAQvSDCj-mqjBdqpylPWZIbchrFK8UoI8BTT7moqNeBN0vfOAov7CQ" />
                <ProgressCard name="Carlos Mendes" progress={64} count="320/500" image="https://lh3.googleusercontent.com/aida-public/AB6AXuCzzGH_k4zz7ZGu3tyT5kBbaQVT7zpLHM-AFPrz6yyAur7OfE5obOMM6_hqJO-R_TXawwW-Y4V-3DdTEixlbwVigFzH5dj2ULPxjXn_wuBOgjABs1uEw2Bup4dMRJNgx0JFBSy9Le_H0mVBC96Joy0-8TpGmAJr2TtcFAVZt1LKxD6GvrVo_4FLeud_ng3amtMFoiNqnzZdPE9jMqt-y57ZSKQkaklBNN830WM4DS8lRr-69VlGic4GDfH9Rj9In2BL-LUbJQbMopQ" />
                <ProgressCard name="Maria Ribeiro" progress={42} count="210/500" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function ConflictRow({ title, authors, revA, revB }: { title: string, authors: string, revA: any, revB: any }) {
  return (
    <tr className="hover:bg-[#FAF8F4]/50 transition-all">
      <td className="p-4">
        <p className="text-sm font-bold text-[#1C1C1E] line-clamp-1">{title}</p>
        <p className="text-[10px] text-[#A1A1AA] mt-0.5">{authors}</p>
      </td>
      <td className="p-4 text-center">
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          revA.decision === "included" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
        )}>
          <span className="opacity-50">[{revA.name}]</span>
          {revA.decision === "included" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {revA.decision === "included" ? "INCLUIR" : "EXCLUIR"}
        </div>
      </td>
      <td className="p-4 text-center">
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          revB.decision === "included" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
        )}>
          <span className="opacity-50">[{revB.name}]</span>
          {revB.decision === "included" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {revB.decision === "included" ? "INCLUIR" : "EXCLUIR"}
        </div>
      </td>
      <td className="p-4 text-right">
        <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase border-[#1C1C1E] text-[#1C1C1E] hover:bg-[#1C1C1E] hover:text-white rounded-lg h-7">
          Resolver
        </Button>
      </td>
    </tr>
  )
}

function ProgressCard({ name, progress, count, image }: { name: string, progress: number, count: string, image?: string }) {
  return (
    <div className="p-5 border border-[#E5E2DA] rounded-xl hover:shadow-md hover:border-[#6B8F71]/30 transition-all group">
      <div className="flex items-center gap-3 mb-6">
        {image ? (
          <img src={image} alt={name} className="w-8 h-8 rounded-full object-cover border border-[#E5E2DA]" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#5c7e6b]/10 text-[#5c7e6b] flex items-center justify-center text-xs font-bold font-serif">
            {name.charAt(0)}
          </div>
        )}
        <span className="text-[11px] font-bold text-[#1C1C1E] group-hover:text-[#6B8F71] transition-colors">{name}</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">Triagem</span>
          <span className="text-xs font-mono font-bold text-[#1C1C1E]">{count}</span>
        </div>
        <div className="w-full bg-[#FAF8F4] h-1.5 rounded-full overflow-hidden border border-[#E5E2DA]">
          <div className="bg-[#1C1C1E] h-full transition-all duration-1000 group-hover:bg-[#6B8F71]" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-[10px] text-right font-bold text-[#A1A1AA]">{progress}%</div>
      </div>
    </div>
  )
}
