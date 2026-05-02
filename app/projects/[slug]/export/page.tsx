"use client"

import { ExportView } from "@/components/litmap/views/export-view"

export default function ExportPage() {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-surface p-8">
      <div className="max-w-5xl mx-auto">
        <ExportView />
      </div>
    </div>
  )
}
