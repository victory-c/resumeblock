"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface TemplateSourceViewerProps {
  latexSource: string
  placeholders: string[]
}

export function TemplateSourceViewer({ latexSource, placeholders }: TemplateSourceViewerProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(latexSource)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const highlighted = latexSource.replace(
    /%%([A-Z0-9_:]+)%%/g,
    '<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">%%$1%%</mark>'
  )

  return (
    <div className="space-y-4">
      {placeholders.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Detected Placeholders</h3>
          <div className="flex flex-wrap gap-2">
            {placeholders.map((p) => (
              <span key={p} className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded font-mono border border-yellow-200 dark:border-yellow-700">
                %%{p}%%
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">LaTeX Source</h3>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre
          className="text-xs font-mono bg-muted rounded-lg p-4 overflow-auto max-h-[600px] whitespace-pre-wrap border"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </div>
  )
}
