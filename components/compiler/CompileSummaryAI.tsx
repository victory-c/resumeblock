"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface CompileSummaryAIProps {
  jobDescriptionId?: string
  facetIds: string[]
  value: string
  onChange: (v: string) => void
}

export function CompileSummaryAI({ jobDescriptionId, facetIds, value, onChange }: CompileSummaryAIProps) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")

  async function generate() {
    if (!jobDescriptionId) return
    setGenerating(true)
    setError("")
    const res = await fetch("/api/compile/generate-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescriptionId, facetIds }),
    })
    const data = await res.json()
    setGenerating(false)
    if (!res.ok || data.error) {
      setError(data.error || "Generation failed")
      return
    }
    onChange(data.summary)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Professional Summary</label>
        {jobDescriptionId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={generate}
            disabled={generating}
            className="h-7 gap-1.5 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {generating ? "Generating..." : "AI Generate"}
          </Button>
        )}
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Brief 2-3 sentence professional summary (optional)"
        rows={3}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
