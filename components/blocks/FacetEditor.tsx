"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BulletList } from "./BulletList"
import { SkillsInput } from "./SkillsInput"
import { Sparkles, Star, Copy, Trash2, Loader2 } from "lucide-react"
import type { ParsedFacet } from "@/types"

interface Props {
  facet: ParsedFacet
  blockId: string
  isOnly: boolean
  onSaved: (f: ParsedFacet) => void
  onDeleted: () => void
}

export function FacetEditor({ facet, blockId, isOnly, onSaved, onDeleted }: Props) {
  const [local, setLocal] = useState(facet)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const save = async (patch: Partial<ParsedFacet>) => {
    const next = { ...local, ...patch }
    setLocal(next)
    setSaving(true)
    try {
      const res = await fetch(`/api/facets/${facet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...patch,
          bulletPoints: next.bulletPoints,
          skills: next.skills,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSaved(data.facet)
      toast.success("Saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const setDefault = async () => {
    await save({ isDefault: true })
  }

  const duplicate = async () => {
    try {
      const res = await fetch(`/api/blocks/${blockId}/facets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetIndustry: local.targetIndustry + " (copy)",
          targetRoleType: local.targetRoleType,
          bulletPoints: local.bulletPoints,
          skills: local.skills,
          isDefault: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSaved(data.facet)
      toast.success("Facet duplicated")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Duplicate failed")
    }
  }

  const deleteFacet = async () => {
    if (!window.confirm("Delete this facet? This cannot be undone.")) return
    try {
      const res = await fetch(`/api/facets/${facet.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Facet deleted")
      onDeleted()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    }
  }

  const aiAssist = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/facets/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockId,
          targetIndustry: local.targetIndustry,
          targetRoleType: local.targetRoleType,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error === "llm_unavailable" ? "LLM is offline" : data.error)
        return
      }
      setLocal((prev) => ({ ...prev, bulletPoints: data.bulletPoints, skills: data.skills }))
      toast.success("AI suggestions applied — review and save")
    } catch {
      toast.error("AI Assist failed")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-2 flex-wrap">
        {local.isDefault && (
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3 fill-current" /> Default
          </Badge>
        )}
        {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
        <div className="ml-auto flex gap-1.5">
          {!local.isDefault && (
            <Button size="sm" variant="outline" onClick={setDefault}>
              <Star className="mr-1.5 h-3.5 w-3.5" /> Set Default
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={duplicate}>
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Duplicate
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={aiAssist}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            AI Assist
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={deleteFacet}
            disabled={isOnly}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Target Industry</label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={local.targetIndustry}
            onChange={(e) => setLocal((p) => ({ ...p, targetIndustry: e.target.value }))}
            onBlur={() => save({ targetIndustry: local.targetIndustry })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Target Role Type</label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={local.targetRoleType}
            onChange={(e) => setLocal((p) => ({ ...p, targetRoleType: e.target.value }))}
            onBlur={() => save({ targetRoleType: local.targetRoleType })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Bullet Points</label>
        <BulletList
          bullets={local.bulletPoints}
          onChange={(bullets) => setLocal((p) => ({ ...p, bullets }))}
        />
        <Button
          size="sm"
          variant="outline"
          className="mt-1"
          onClick={() => save({ bulletPoints: local.bulletPoints })}
        >
          Save Bullets
        </Button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Skills</label>
        <SkillsInput
          skills={local.skills}
          onChange={(skills) => setLocal((p) => ({ ...p, skills }))}
        />
        <Button
          size="sm"
          variant="outline"
          className="mt-1"
          onClick={() => save({ skills: local.skills })}
        >
          Save Skills
        </Button>
      </div>
    </div>
  )
}
