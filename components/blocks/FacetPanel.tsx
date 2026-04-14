"use client"

import { useState } from "react"
import { Star, Plus } from "lucide-react"
import { FacetEditor } from "./FacetEditor"
import { AddFacetForm } from "./AddFacetForm"
import { cn } from "@/lib/utils"
import type { ParsedFacet, BlockWithParsedFacets } from "@/types"

interface Props {
  block: BlockWithParsedFacets
}

export function FacetPanel({ block }: Props) {
  const [facets, setFacets] = useState<ParsedFacet[]>(block.facets)
  const [activeIndex, setActiveIndex] = useState<number | "add">(0)

  const handleSaved = (updated: ParsedFacet) => {
    setFacets((prev) => {
      const idx = prev.findIndex((f) => f.id === updated.id)
      if (idx === -1) return [...prev, updated]
      return prev.map((f, i) => (i === idx ? updated : f))
    })
  }

  const handleDeleted = (deletedId: string) => {
    setFacets((prev) => {
      const next = prev.filter((f) => f.id !== deletedId)
      setActiveIndex(Math.min(activeIndex as number, next.length - 1))
      return next
    })
  }

  const handleAdded = (facet: ParsedFacet) => {
    setFacets((prev) => [...prev, facet])
    setActiveIndex(facets.length)
  }

  return (
    <div>
      {/* Tab row */}
      <div className="flex flex-wrap gap-1 border-b pb-0">
        {facets.map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors",
              activeIndex === i
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {f.isDefault && <Star className="h-3 w-3 fill-current text-amber-500" />}
            <span className="max-w-28 truncate">{f.targetIndustry || "Unnamed"}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setActiveIndex("add")}
          className={cn(
            "flex items-center gap-1 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors",
            activeIndex === "add"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          <Plus className="h-3.5 w-3.5" /> Add Facet
        </button>
      </div>

      {/* Tab content */}
      <div>
        {activeIndex === "add" ? (
          <AddFacetForm blockId={block.id} onSaved={handleAdded} />
        ) : (
          facets[activeIndex] && (
            <FacetEditor
              key={facets[activeIndex].id}
              facet={facets[activeIndex]}
              blockId={block.id}
              isOnly={facets.length === 1}
              onSaved={handleSaved}
              onDeleted={() => handleDeleted(facets[activeIndex].id)}
            />
          )
        )}
      </div>
    </div>
  )
}
