"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { COMMON_INDUSTRIES } from "@/components/parser/IndustryAutocomplete"
import type { ParsedFacet } from "@/types"
import { Loader2 } from "lucide-react"

interface Props {
  blockId: string
  onSaved: (facet: ParsedFacet) => void
}

export function AddFacetForm({ blockId, onSaved }: Props) {
  const [industry, setIndustry] = useState("")
  const [roleType, setRoleType] = useState("")
  const [aiAssist, setAiAssist] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!industry.trim() || !roleType.trim()) {
      toast.error("Industry and role type are required")
      return
    }
    setLoading(true)
    try {
      let bullets: string[] = []
      let skills: string[] = []

      if (aiAssist) {
        const aiRes = await fetch("/api/facets/ai-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockId, targetIndustry: industry, targetRoleType: roleType }),
        })
        if (aiRes.ok) {
          const aiData = await aiRes.json()
          bullets = aiData.bulletPoints || []
          skills = aiData.skills || []
        }
      }

      const res = await fetch(`/api/blocks/${blockId}/facets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetIndustry: industry.trim(),
          targetRoleType: roleType.trim(),
          bulletPoints: bullets,
          skills,
          isDefault: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Facet added")
      onSaved(data.facet)
      setIndustry("")
      setRoleType("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add facet")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 py-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Target Industry *</label>
        <input
          list="add-industry-datalist"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. Software Engineering"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <datalist id="add-industry-datalist">
          {COMMON_INDUSTRIES.map((i) => <option key={i} value={i} />)}
        </datalist>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Target Role Type *</label>
        <input
          value={roleType}
          onChange={(e) => setRoleType(e.target.value)}
          placeholder="e.g. Backend Engineer"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={aiAssist}
          onChange={(e) => setAiAssist(e.target.checked)}
          className="h-4 w-4 rounded"
        />
        AI Assist — generate bullet points automatically
      </label>
      <Button type="submit" size="sm" disabled={loading}>
        {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
        Add Facet
      </Button>
    </form>
  )
}
