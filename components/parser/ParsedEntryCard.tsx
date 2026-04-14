"use client"

import { Badge } from "@/components/ui/badge"
import { IndustryAutocomplete } from "./IndustryAutocomplete"
import type { ParsedResumeEntry } from "@/types"
import { X, Plus, Trash2 } from "lucide-react"

type EntryWithLabels = ParsedResumeEntry & {
  targetIndustry: string
  targetRoleType: string
}

interface Props {
  entry: EntryWithLabels
  onChange: (updated: EntryWithLabels) => void
  onDelete: () => void
}

const BLOCK_TYPES = ["work", "project", "volunteer", "education", "award", "society", "club", "publicService", "other"] as const

const TYPE_LABELS: Record<string, string> = {
  work: "Work",
  project: "Project",
  volunteer: "Volunteer",
  education: "Education",
  award: "Award",
  society: "Society",
  club: "Club",
  publicService: "Public Service",
  other: "Other",
}

export function ParsedEntryCard({ entry, onChange, onDelete }: Props) {
  const update = (patch: Partial<EntryWithLabels>) => onChange({ ...entry, ...patch })

  const updateBullet = (i: number, val: string) => {
    const bullets = [...entry.bulletPoints]
    bullets[i] = val
    update({ bulletPoints: bullets })
  }

  const deleteBullet = (i: number) => {
    update({ bulletPoints: entry.bulletPoints.filter((_, idx) => idx !== i) })
  }

  const addBullet = () => {
    update({ bulletPoints: [...entry.bulletPoints, ""] })
  }

  const isPresent = entry.endDate === null || entry.endDate === undefined

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 relative">
      {entry.needsReview && (
        <Badge variant="outline" className="absolute top-3 right-10 text-yellow-600 border-yellow-400 bg-yellow-50 text-xs">
          Needs Review
        </Badge>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
        title="Remove entry"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="grid grid-cols-2 gap-3 pr-16">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Title *</label>
          <input
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={entry.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="e.g. Software Engineer"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Organization *</label>
          <input
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={entry.organization}
            onChange={(e) => update({ organization: e.target.value })}
            placeholder="e.g. Acme Corp"
          />
        </div>
      </div>

      <div className="space-y-1 pr-16">
        <label className="text-xs font-medium text-muted-foreground">Location</label>
        <input
          className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={entry.location ?? ""}
          onChange={(e) => update({ location: e.target.value })}
          placeholder="e.g. Berkeley, CA"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Start Date</label>
          <input
            type="date"
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={entry.startDate && entry.startDate !== "unknown" ? entry.startDate.slice(0, 10) : ""}
            onChange={(e) => update({ startDate: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">End Date</label>
          <input
            type="date"
            disabled={isPresent}
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            value={!isPresent && entry.endDate && entry.endDate !== "unknown" ? entry.endDate.slice(0, 10) : ""}
            onChange={(e) => update({ endDate: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Present</label>
          <div className="flex items-center h-8">
            <input
              type="checkbox"
              checked={isPresent}
              onChange={(e) => update({ endDate: e.target.checked ? null : "" })}
              className="h-4 w-4 rounded border-input"
            />
            <span className="ml-2 text-sm">Current</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <select
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={entry.type}
            onChange={(e) => update({ type: e.target.value as ParsedResumeEntry["type"] })}
          >
            {BLOCK_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Industry</label>
          <IndustryAutocomplete
            value={entry.targetIndustry}
            onChange={(v) => update({ targetIndustry: v })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Role Type</label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={entry.targetRoleType}
            onChange={(e) => update({ targetRoleType: e.target.value })}
            placeholder="e.g. Backend Engineer"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Bullet Points</label>
        <div className="space-y-1.5">
          {entry.bulletPoints.map((bullet, i) => (
            <div key={i} className="flex gap-1.5">
              <input
                className="flex h-8 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={bullet}
                onChange={(e) => updateBullet(i, e.target.value)}
                placeholder={`Bullet ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => deleteBullet(i)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-input text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addBullet}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add bullet
          </button>
        </div>
      </div>
    </div>
  )
}
