"use client"

import { useState } from "react"
import { toast } from "sonner"
import { FacetPanel } from "./FacetPanel"
import type { BlockWithParsedFacets } from "@/types"

function formatDate(d: Date | string | null) {
  if (!d) return "Present"
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

interface Props {
  block: BlockWithParsedFacets
}

export function BlockDetailClient({ block: initial }: Props) {
  const [block, setBlock] = useState(initial)
  const [editField, setEditField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  const startEdit = (field: string, value: string) => {
    setEditField(field)
    setEditValue(value)
  }

  const saveField = async (field: string, value: string) => {
    if (value === (block as Record<string, unknown>)[field]) {
      setEditField(null)
      return
    }
    try {
      const res = await fetch(`/api/blocks/${block.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBlock((prev) => ({ ...prev, ...data.block }))
      toast.success("Saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setEditField(null)
    }
  }

  const TYPE_COLORS: Record<string, string> = {
    work: "bg-blue-100 text-blue-700",
    project: "bg-purple-100 text-purple-700",
    volunteer: "bg-green-100 text-green-700",
    education: "bg-amber-100 text-amber-700",
    award: "bg-yellow-100 text-yellow-700",
    society: "bg-violet-100 text-violet-700",
    club: "bg-fuchsia-100 text-fuchsia-700",
    publicService: "bg-teal-100 text-teal-700",
    other: "bg-gray-100 text-gray-600",
  }

  return (
    <div>
      {/* Block header */}
      <div className="mb-6 space-y-1">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            {editField === "title" ? (
              <input
                autoFocus
                className="text-xl font-semibold w-full bg-transparent border-b border-primary outline-none pb-0.5"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => saveField("title", editValue)}
                onKeyDown={(e) => { if (e.key === "Enter") saveField("title", editValue) }}
              />
            ) : (
              <h1
                className="text-xl font-semibold cursor-pointer hover:text-primary transition-colors"
                onClick={() => startEdit("title", block.title)}
                title="Click to edit"
              >
                {block.title}
              </h1>
            )}
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${TYPE_COLORS[block.type] || TYPE_COLORS.other}`}>
            {block.type}
          </span>
        </div>

        {editField === "organization" ? (
          <input
            autoFocus
            className="text-muted-foreground w-full bg-transparent border-b border-primary outline-none text-sm pb-0.5"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => saveField("organization", editValue)}
            onKeyDown={(e) => { if (e.key === "Enter") saveField("organization", editValue) }}
          />
        ) : (
          <p
            className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onClick={() => startEdit("organization", block.organization)}
            title="Click to edit"
          >
            {block.organization}
          </p>
        )}

        {editField === "location" ? (
          <input
            autoFocus
            className="text-muted-foreground w-full bg-transparent border-b border-primary outline-none text-xs pb-0.5"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => saveField("location", editValue)}
            onKeyDown={(e) => { if (e.key === "Enter") saveField("location", editValue) }}
            placeholder="Add location (e.g. Berkeley, CA)"
          />
        ) : (
          <p
            className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onClick={() => startEdit("location", (block as Record<string, unknown>).location as string || "")}
            title="Click to edit location"
          >
            {(block as Record<string, unknown>).location as string || "Add location..."}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          {formatDate(block.startDate)} – {formatDate(block.endDate)}
        </p>
      </div>

      {/* Facet panel */}
      <div className="rounded-lg border">
        <div className="border-b px-4 py-2">
          <h2 className="text-sm font-medium">Facets</h2>
        </div>
        <div className="px-4">
          <FacetPanel block={block} />
        </div>
      </div>
    </div>
  )
}
