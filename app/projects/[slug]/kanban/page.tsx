"use client"

import { KanbanView } from "@/components/litmap/views/kanban-view"
import { useRouter, useParams } from "next/navigation"

export default function KanbanPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  return (
    <KanbanView 
      onNavigate={(path) => {
        if (path.startsWith("references/")) {
          router.push(`/projects/${slug}/${path}`)
        } else {
          router.push(`/projects/${slug}/${path}`)
        }
      }} 
    />
  )
}
