"use client"

import { useState, useEffect, useCallback } from "react"
import { BlockGrid } from "./BlockGrid"
import { CreateBlockDialog } from "./CreateBlockDialog"
import { LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"

type BlockWithCount = {
  id: string
  title: string
  organization: string
  startDate: Date
  endDate: Date | null
  type: string
  _count: { facets: number }
}

interface Props {
  initialBlocks: BlockWithCount[]
}

const BLOCK_TYPES = ["all", "work", "project", "volunteer", "education", "other"]
const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest First" },
  { value: "date_asc", label: "Oldest First" },
  { value: "updated", label: "Recently Updated" },
]

export function BlockLibraryClient({ initialBlocks }: Props) {
  const [blocks, setBlocks] = useState(initialBlocks)
  const [search, setSearch] = useState("")
  const [type, setType] = useState("all")
  const [sort, setSort] = useState("date_desc")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [loading, setLoading] = useState(false)

  const fetchBlocks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (type !== "all") params.set("type", type)
      params.set("sort", sort)
      const res = await fetch(`/api/blocks?${params}`)
      const data = await res.json()
      setBlocks(data.blocks || [])
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [search, type, sort])

  useEffect(() => {
    const t = setTimeout(fetchBlocks, 300)
    return () => clearTimeout(t)
  }, [fetchBlocks])

  const handleDeleted = (id: string) => setBlocks((prev) => prev.filter((b) => b.id !== id))

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search blocks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-9 w-56 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {BLOCK_TYPES.map((t) => (
            <option key={t} value={t}>{t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn("flex h-9 w-9 items-center justify-center rounded-md border transition-colors", view === "grid" ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-accent")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn("flex h-9 w-9 items-center justify-center rounded-md border transition-colors", view === "list" ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-accent")}
          >
            <List className="h-4 w-4" />
          </button>
          <CreateBlockDialog />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading...</div>
      ) : (
        <BlockGrid blocks={blocks} onDeleted={handleDeleted} />
      )}
    </div>
  )
}
