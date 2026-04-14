import { Badge } from "@/components/ui/badge"
import type { JDAnalysis } from "@/types"

interface Props {
  analysis: JDAnalysis
}

const CONFIDENCE_COLORS = {
  high: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-red-100 text-red-700",
}

export function JDAnalysisSummary({ analysis }: Props) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="font-medium">{analysis.industry}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{analysis.roleType}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground capitalize">{analysis.experienceLevel}</span>
        <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_COLORS[analysis.confidence] || CONFIDENCE_COLORS.medium}`}>
          {analysis.confidence} confidence
        </span>
      </div>

      {analysis.requiredSkills.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Required Skills</p>
          <div className="flex flex-wrap gap-1">
            {analysis.requiredSkills.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
            ))}
          </div>
        </div>
      )}

      {analysis.preferredSkills.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Preferred Skills</p>
          <div className="flex flex-wrap gap-1">
            {analysis.preferredSkills.map((s) => (
              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
            ))}
          </div>
        </div>
      )}

      {analysis.atsKeywords.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">ATS Keywords</p>
          <div className="flex flex-wrap gap-1">
            {analysis.atsKeywords.map((k) => (
              <span key={k} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{k}</span>
            ))}
          </div>
        </div>
      )}

      {analysis.keyResponsibilities.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Key Responsibilities</p>
          <ul className="text-xs text-muted-foreground space-y-0.5 list-disc ml-3">
            {analysis.keyResponsibilities.slice(0, 4).map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
