"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ParsedEntryCard } from "./ParsedEntryCard"
import { RawTextViewer } from "./RawTextViewer"
import type { ParsedResumeEntry } from "@/types"

type EntryWithLabels = ParsedResumeEntry & {
  targetIndustry: string
  targetRoleType: string
}

interface Props {
  initialEntries: EntryWithLabels[]
  initialLanguages: string[]
  rawText: string
  onSaved: (blockIds: string[]) => void
}

function blankEntry(): EntryWithLabels {
  return {
    title: "",
    organization: "",
    startDate: "",
    endDate: null,
    type: "work",
    bulletPoints: [],
    needsReview: false,
    targetIndustry: "",
    targetRoleType: "",
  }
}

export function EntryReviewList({ initialEntries, initialLanguages, rawText, onSaved }: Props) {
  const [entries, setEntries] = useState<EntryWithLabels[]>(
    initialEntries.length > 0 ? initialEntries : [blankEntry()]
  )
  const [languages, setLanguages] = useState<string[]>(initialLanguages)
  const [langInput, setLangInput] = useState("")
  const [saving, setSaving] = useState(false)

  const updateEntry = (i: number, updated: EntryWithLabels) => {
    setEntries((prev) => prev.map((e, idx) => (idx === i ? updated : e)))
  }

  const deleteEntry = (i: number) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== i))
  }

  const addLanguage = () => {
    const trimmed = langInput.trim()
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages((prev) => [...prev, trimmed])
    }
    setLangInput("")
  }

  const handleSave = async () => {
    const valid = entries.filter((e) => e.title.trim() && e.organization.trim())
    if (valid.length === 0) {
      toast.error("Add at least one entry with title and organization.")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/blocks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: valid, languages }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save")
      toast.success(`Saved ${data.created.blocks} block(s) to your library!`)
      onSaved(data.blockIds)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save blocks")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {rawText && <RawTextViewer rawText={rawText} />}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {entries.length} entr{entries.length !== 1 ? "ies" : "y"} found
        </p>
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {saving ? "Saving..." : "Save to Block Storage"}
        </Button>
      </div>

      <div className="space-y-3">
        {entries.map((entry, i) => (
          <ParsedEntryCard
            key={i}
            entry={entry}
            onChange={(updated) => updateEntry(i, updated)}
            onDelete={() => deleteEntry(i)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setEntries((prev) => [...prev, blankEntry()])}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed py-3 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
      >
        <Plus className="h-4 w-4" /> Add Another Entry
      </button>

      {/* Languages section */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <p className="text-sm font-medium">Languages</p>
        <div className="flex flex-wrap gap-1.5">
          {languages.map((lang, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              {lang}
              <button type="button" onClick={() => setLanguages((prev) => prev.filter((_, idx) => idx !== i))}>
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </span>
          ))}
          {languages.length === 0 && <p className="text-xs text-muted-foreground">No languages detected — add manually below.</p>}
        </div>
        <div className="flex gap-2">
          <input
            className="flex h-8 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder='e.g. Spanish (Fluent)'
            value={langInput}
            onChange={(e) => setLangInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLanguage() } }}
          />
          <Button type="button" variant="outline" size="sm" onClick={addLanguage}>Add</Button>
        </div>
      </div>
    </div>
  )
}
