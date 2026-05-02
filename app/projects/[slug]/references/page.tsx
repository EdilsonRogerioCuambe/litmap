"use client"

import { ReferencesView } from "@/components/litmap/views/references-view"
import { useRouter, useParams } from "next/navigation"

export default function ReferencesPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const handleNavigate = (id: string) => {
    router.push(`/projects/${slug}/${id}`)
  }

  return <ReferencesView onNavigate={handleNavigate} />
}
