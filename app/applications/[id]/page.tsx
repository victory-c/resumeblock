import { notFound } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { RecommendationClient } from "@/components/jd/RecommendationClient"
import type { JDAnalysis, FacetMatchResult, CoverageReport } from "@/types"
import { ArrowLeft } from "lucide-react"

// Inline matching logic to avoid HTTP self-calls in server components
async function getRecommendations(jdId: string, analysis: JDAnalysis) {
  const blocks = await prisma.block.findMany({ include: { facets: true } })
  const requiredSkills = analysis.requiredSkills.map((s) => s.toLowerCase())

  function scoreSkills(facetSkills: string[]): number {
    if (requiredSkills.length === 0) return 25
    const lower = facetSkills.map((s) => s.toLowerCase())
    const matches = requiredSkills.filter((rs) => lower.some((fs) => fs.includes(rs) || rs.includes(fs)))
    return Math.round((matches.length / requiredSkills.length) * 50)
  }

  function scoreIndustry(facetIndustry: string): number {
    const jd = analysis.industry.toLowerCase()
    const fi = facetIndustry.toLowerCase()
    if (fi === jd) return 30
    const jdWords = jd.split(/\s+/)
    const fWords = fi.split(/[\s/]+/)
    return jdWords.filter((w) => fWords.includes(w)).length > 0 ? 15 : 0
  }

  function scoreRoleType(facetRole: string): number {
    const jd = analysis.roleType.toLowerCase().split(/\s+/)
    const fr = facetRole.toLowerCase().split(/[\s/]+/)
    const overlap = jd.filter((w) => fr.includes(w))
    if (!overlap.length) return 0
    return Math.round((overlap.length / Math.max(jd.length, fr.length)) * 20)
  }

  const results: (FacetMatchResult & { skills: string[] })[] = []

  for (const block of blocks) {
    let best: (FacetMatchResult & { skills: string[] }) | null = null
    for (const facet of block.facets) {
      const skills = JSON.parse(facet.skills) as string[]
      const ss = scoreSkills(skills)
      const is_ = scoreIndustry(facet.targetIndustry)
      const rs = scoreRoleType(facet.targetRoleType)
      const total = ss + is_ + rs
      const candidate = { blockId: block.id, facetId: facet.id, blockTitle: block.title, blockOrganization: block.organization, facetIndustry: facet.targetIndustry, facetRoleType: facet.targetRoleType, totalScore: total, skillScore: ss, industryScore: is_, roleTypeScore: rs, included: true, skills }
      if (!best || total > best.totalScore) best = candidate
    }
    if (best) results.push(best)
  }

  results.sort((a, b) => b.totalScore - a.totalScore)
  const top = results.slice(0, 10)

  const covered: Record<string, string> = {}
  const gaps: string[] = []
  for (const skill of analysis.requiredSkills) {
    const match = top.find((r) => r.skills.some((s) => s.toLowerCase().includes(skill.toLowerCase())))
    if (match) covered[skill] = match.facetId
    else gaps.push(skill)
  }

  const recommendations: FacetMatchResult[] = top.map(({ skills: _s, ...r }) => r)
  const coverageReport: CoverageReport = { covered, gaps }
  return { recommendations, coverageReport }
}

export default async function ApplicationPage({ params }: { params: { id: string } }) {
  const jd = await prisma.jobDescription.findUnique({ where: { id: params.id } })
  if (!jd) notFound()

  let analysis: JDAnalysis | null = null
  try { analysis = JSON.parse(jd.parsedRequirements) } catch { /* empty */ }

  if (!analysis) {
    return (
      <div className="p-8">
        <p className="text-destructive">No analysis available for this job description.</p>
      </div>
    )
  }

  const { recommendations, coverageReport } = await getRecommendations(jd.id, analysis)

  return (
    <div className="p-8">
      <Link
        href="/applications"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Applications
      </Link>
      <RecommendationClient
        jdId={jd.id}
        companyName={jd.companyName}
        roleTitle={jd.roleTitle}
        jdAnalysis={analysis}
        initialRecommendations={recommendations}
        coverageReport={coverageReport}
      />
    </div>
  )
}
