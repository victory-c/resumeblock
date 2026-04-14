"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Trash2 } from "lucide-react"

type BlockWithCount = {
  id: string
  title: string
  organization: string
  startDate: Date
  endDate: Date | null
  type: string
  _count: { facets: number }
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

function formatDate(d: Date | string | null) {
  if (!d) return "Present"
  const date = new Date(d)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

interface Props {
  block: BlockWithCount
  onDeleted: () => void
}

export function BlockCard({ block, onDeleted }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${block.title}"? All facets will be removed.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/blocks/${block.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      toast.success("Block deleted")
      onDeleted()
    } catch {
      toast.error("Failed to delete block")
    } finally {
      setDeleting(false)
      setMenuOpen(false)
    }
  }

  return (
    <div
      className="relative rounded-lg border bg-card p-4 cursor-pointer hover:shadow-sm transition-shadow"
      onClick={() => router.push(`/blocks/${block.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{block.title}</p>
          <p className="text-sm text-muted-foreground truncate">{block.organization}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(block.startDate)} – {formatDate(block.endDate)}
          </p>
        </div>
        <div className="flex items-start gap-1.5 shrink-0">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[block.type] || TYPE_COLORS.other}`}>
            {block.type}
          </span>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 w-36 rounded-md border bg-popover shadow-md">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5">
        <Badge variant="secondary" className="text-xs">
          {block._count.facets} facet{block._count.facets !== 1 ? "s" : ""}
        </Badge>
      </div>
    </div>
  )
}
