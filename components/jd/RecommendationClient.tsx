"use client"

import { useState } from "react"
import { JDAnalysisSummary } from "./JDAnalysisSummary"
import { RecommendationList } from "./RecommendationList"
import { CoverageReport } from "./CoverageReport"
import type { FacetMatchResult, CoverageReport as CoverageReportType, JDAnalysis } from "@/types"

interface Props {
  jdId: string
  companyName: string
  roleTitle: string
  jdAnalysis: JDAnalysis
  initialRecommendations: FacetMatchResult[]
  coverageReport: CoverageReportType
}

export function RecommendationClient({
  jdId,
  companyName,
  roleTitle,
  jdAnalysis,
  initialRecommendations,
  coverageReport,
}: Props) {
  const [recommendations, setRecommendations] = useState(initialRecommendations)

  const handleToggle = (facetId: string) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.facetId === facetId ? { ...r, included: !r.included } : r))
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{roleTitle}</h1>
        <p className="text-sm text-muted-foreground">{companyName}</p>
      </div>

      <div className="grid grid-cols-[280px_1fr_240px] gap-6">
        {/* Left: JD Analysis */}
        <div>
          <h2 className="text-sm font-medium mb-3">JD Analysis</h2>
          <div className="rounded-lg border p-3">
            <JDAnalysisSummary analysis={jdAnalysis} />
          </div>
        </div>

        {/* Center: Recommendations */}
        <div>
          <h2 className="text-sm font-medium mb-3">Recommended Blocks</h2>
          <RecommendationList
            recommendations={recommendations}
            onReorder={setRecommendations}
            onToggle={handleToggle}
            jdId={jdId}
          />
        </div>

        {/* Right: Coverage */}
        <div>
          <h2 className="text-sm font-medium mb-3">Skill Coverage</h2>
          <div className="rounded-lg border p-3">
            <CoverageReport report={coverageReport} />
          </div>
        </div>
      </div>
    </div>
  )
}
