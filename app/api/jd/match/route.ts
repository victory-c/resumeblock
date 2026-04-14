import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkOllamaStatus, generate, parseJSONResponse } from "@/lib/ollama"
import { getMatchFacetsPrompt } from "@/lib/prompts/match-facets"
import type { JDAnalysis, FacetMatchResult, CoverageReport } from "@/types"

function scoreSkills(facetSkills: string[], requiredSkills: string[]): number {
  if (requiredSkills.length === 0) return 25
  const lower = facetSkills.map((s) => s.toLowerCase())
  const matches = requiredSkills.filter((rs) =>
    lower.some((fs) => fs.includes(rs) || rs.includes(fs))
  )
  return Math.round((matches.length / requiredSkills.length) * 50)
}

function scoreIndustry(facetIndustry: string, jdIndustry: string): number {
  const jd = jdIndustry.toLowerCase()
  const fi = facetIndustry.toLowerCase()
  if (fi === jd) return 30
  const jdWords = jd.split(/\s+/)
  const fWords = fi.split(/[\s/]+/)
  const overlap = jdWords.filter((w) => fWords.includes(w))
  return overlap.length > 0 ? 15 : 0
}

function scoreRoleType(facetRole: string, jdRole: string): number {
  const jd = jdRole.toLowerCase().split(/\s+/)
  const fr = facetRole.toLowerCase().split(/[\s/]+/)
  const overlap = jd.filter((w) => fr.includes(w))
  if (overlap.length === 0) return 0
  return Math.round((overlap.length / Math.max(jd.length, fr.length)) * 20)
}

export async function POST(req: NextRequest) {
  let body: { jobDescriptionId: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const jd = await prisma.jobDescription.findUnique({ where: { id: body.jobDescriptionId } })
  if (!jd) return NextResponse.json({ error: "JD not found" }, { status: 404 })

  const analysis: JDAnalysis = JSON.parse(jd.parsedRequirements)
  const requiredSkills = analysis.requiredSkills.map((s) => s.toLowerCase())

  const blocks = await prisma.block.findMany({
    include: { facets: true },
  })

  // Score each block's best facet
  type Candidate = FacetMatchResult & { skills: string[]; bulletPoints: string[] }
  const results: Candidate[] = []

  for (const block of blocks) {
    let best: Candidate | null = null
    for (const facet of block.facets) {
      const skills = JSON.parse(facet.skills) as string[]
      const bullets = JSON.parse(facet.bulletPoints) as string[]
      const skillScore = scoreSkills(skills, requiredSkills)
      const industryScore = scoreIndustry(facet.targetIndustry, analysis.industry)
      const roleTypeScore = scoreRoleType(facet.targetRoleType, analysis.roleType)
      const totalScore = skillScore + industryScore + roleTypeScore
      const candidate: Candidate = {
        blockId: block.id,
        facetId: facet.id,
        blockTitle: block.title,
        blockOrganization: block.organization,
        facetIndustry: facet.targetIndustry,
        facetRoleType: facet.targetRoleType,
        totalScore,
        skillScore,
        industryScore,
        roleTypeScore,
        skills,
        bulletPoints: bullets,
        included: true,
      }
      if (!best || totalScore > best.totalScore) best = candidate
    }
    if (best) results.push(best)
  }

  results.sort((a, b) => b.totalScore - a.totalScore)
  const top = results.slice(0, 10)

  // LLM refinement
  const ollamaStatus = await checkOllamaStatus()
  let finalResults: FacetMatchResult[] = top.map(({ skills: _s, bulletPoints: _b, ...r }) => r)

  if (ollamaStatus !== "offline" && top.length > 0) {
    try {
      const prompt = getMatchFacetsPrompt(analysis, top)
      const raw = await generate(prompt)
      const parsed = parseJSONResponse<{ rankedOrder: number[]; reasoning: Record<string, string> }>(raw)
      if (parsed?.rankedOrder) {
        const reordered = parsed.rankedOrder
          .filter((n) => n >= 1 && n <= top.length)
          .map((n) => {
            const item = top[n - 1]
            return { ...item, reasoning: parsed.reasoning?.[n] || undefined, skills: undefined, bulletPoints: undefined } as unknown as FacetMatchResult
          })
        if (reordered.length > 0) finalResults = reordered
      }
    } catch { /* keep deterministic order */ }
  }

  // Coverage report
  const covered: Record<string, string> = {}
  const gaps: string[] = []
  for (const skill of analysis.requiredSkills) {
    const match = top.find((r) => r.skills.some((s) => s.toLowerCase().includes(skill.toLowerCase())))
    if (match) covered[skill] = match.facetId
    else gaps.push(skill)
  }

  const coverageReport: CoverageReport = { covered, gaps }

  return NextResponse.json({ recommendations: finalResults, coverageReport, jdAnalysis: analysis })
}
