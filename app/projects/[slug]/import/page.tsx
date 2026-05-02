"use client"

import { ImportView } from "@/components/litmap/views/import-view"

export default function ImportPage() {
  return (
    <div className="flex-1 h-full bg-[#FAF8F4] overflow-y-auto">
      <div className="max-w-[1400px] mx-auto min-h-full">
        <ImportView />
      </div>
    </div>
  )
}
