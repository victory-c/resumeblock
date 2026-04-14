"use client"

import { Badge } from "@/components/ui/badge"
import type { FacetMatchResult } from "@/types"
import { ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react"

interface Props {
  result: FacetMatchResult
  onToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
  rank: number
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 70) return <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">Strong</Badge>
  if (score >= 40) return <Badge className="text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Good</Badge>
  return <Badge variant="outline" className="text-xs text-muted-foreground">Partial</Badge>
}

export function RecommendationCard({ result, onToggle, onMoveUp, onMoveDown, isFirst, isLast, rank }: Props) {
  return (
    <div className={`rounded-lg border p-3 transition-opacity ${result.included ? "" : "opacity-50"}`}>
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-0.5 mt-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <span className="text-xs text-muted-foreground font-mono mt-1 w-5">#{rank}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{result.blockTitle}</p>
              <p className="text-xs text-muted-foreground truncate">{result.blockOrganization}</p>
            </div>
            <ScoreBadge score={result.totalScore} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {result.facetIndustry} · {result.facetRoleType}
          </p>
          {result.reasoning && (
            <p className="text-xs text-muted-foreground mt-1 italic">{result.reasoning}</p>
          )}
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
          title={result.included ? "Exclude from resume" : "Include in resume"}
        >
          {result.included ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}
