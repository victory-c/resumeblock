"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RecommendationCard } from "./RecommendationCard"
import type { FacetMatchResult } from "@/types"
import { FileText } from "lucide-react"

interface Props {
  recommendations: FacetMatchResult[]
  onReorder: (r: FacetMatchResult[]) => void
  onToggle: (facetId: string) => void
  jdId: string
}

export function RecommendationList({ recommendations, onReorder, onToggle, jdId }: Props) {
  const move = (i: number, dir: -1 | 1) => {
    const next = [...recommendations]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onReorder(next)
  }

  const included = recommendations.filter((r) => r.included)
  const facetIds = included.map((r) => r.facetId).join(",")
  const blockIds = included.map((r) => r.blockId).join(",")
  const compileUrl = `/compile/new?jdId=${jdId}&facets=${facetIds}&blocks=${blockIds}`

  if (recommendations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        <p>No matching blocks found.</p>
        <p className="mt-1">
          <Link href="/blocks" className="underline hover:text-foreground">Add blocks to your library</Link> to get recommendations.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {included.length} of {recommendations.length} blocks selected
        </p>
        <Link href={compileUrl}>
          <Button size="sm" disabled={included.length === 0}>
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Compile Resume
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {recommendations.map((r, i) => (
          <RecommendationCard
            key={r.facetId}
            result={r}
            rank={i + 1}
            onToggle={() => onToggle(r.facetId)}
            onMoveUp={() => move(i, -1)}
            onMoveDown={() => move(i, 1)}
            isFirst={i === 0}
            isLast={i === recommendations.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
