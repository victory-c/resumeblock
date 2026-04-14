import type { CoverageReport as CoverageReportType } from "@/types"

interface Props {
  report: CoverageReportType
}

export function CoverageReport({ report }: Props) {
  const covered = Object.keys(report.covered)
  const gaps = report.gaps

  return (
    <div className="space-y-4 text-sm">
      {covered.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Covered ({covered.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {covered.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {gaps.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Not Covered ({gaps.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {gaps.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs text-red-700"
              >
                {skill}
              </span>
            ))}
          </div>
          {gaps.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Consider adding facets that highlight these skills in your Block Library.
            </p>
          )}
        </div>
      )}

      {covered.length === 0 && gaps.length === 0 && (
        <p className="text-xs text-muted-foreground">No skill requirements found in the JD.</p>
      )}
    </div>
  )
}
