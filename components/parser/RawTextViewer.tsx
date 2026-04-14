"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface Props {
  rawText: string
}

export function RawTextViewer({ rawText }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-4 rounded-md border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>Extracted text from PDF</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="border-t px-3 pb-3">
          <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-xs font-mono bg-muted p-2 rounded text-muted-foreground">
            {rawText || "(empty)"}
          </pre>
        </div>
      )}
    </div>
  )
}
