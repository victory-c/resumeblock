import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkOllamaStatus, generate, parseJSONResponse } from "@/lib/ollama"
import { getMatchFacetsPrompt } from "@/lib/prompts/match-facets"
import type { JDAnalysis, FacetMatchResult, CoverageReport } from "@/types"
import { enforceLocalRequest, readLimitedJson } from "@/lib/compile-security"

type Candidate = FacetMatchResult & { skills: string[]; bulletPoints: string[] }

function normalizedWords(value: string): string[] {
  return value.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim().split(/\s+/).filter(Boolean)
}

function skillsMatch(left: string, right: string): boolean {
  const a = normalizedWords(left).join(" ")
  const b = normalizedWords(right).join(" ")
  return a === b || (a.length > 2 && b.length > 2 && (` ${a} `).includes(` ${b} `) || (` ${b} `).includes(` ${a} `))
}

function publicResult(candidate: Candidate): FacetMatchResult {
  const { skills, bulletPoints, ...result } = candidate
  void skills
  void bulletPoints
  return result
}

function scoreSkills(facetSkills: string[], requiredSkills: string[]): number {
  if (requiredSkills.length === 0) return 25
  const lower = facetSkills.map((s) => s.toLowerCase())
  const matches = requiredSkills.filter((rs) =>
    lower.some((fs) => skillsMatch(fs, rs))
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
  const localOnlyError = enforceLocalRequest(req)
  if (localOnlyError) return localOnlyError
  const parsedBody = await readLimitedJson(req)
  if (parsedBody.response) return parsedBody.response
  const body = parsedBody.body as { jobDescriptionId?: string }
  if (!body.jobDescriptionId || typeof body.jobDescriptionId !== "string") {
    return NextResponse.json({ error: "jobDescriptionId is required" }, { status: 400 })
  }

  const jd = await prisma.jobDescription.findUnique({ where: { id: body.jobDescriptionId } })
  if (!jd) return NextResponse.json({ error: "JD not found" }, { status: 404 })

  let analysis: JDAnalysis
  try { analysis = JSON.parse(jd.parsedRequirements) as JDAnalysis } catch {
    return NextResponse.json({ error: "Job description analysis is invalid" }, { status: 422 })
  }
  if (!Array.isArray(analysis.requiredSkills)) {
    return NextResponse.json({ error: "Job description analysis is invalid" }, { status: 422 })
  }
  const requiredSkills = analysis.requiredSkills.map((s) => s.toLowerCase())

  const blocks = await prisma.block.findMany({
    include: { facets: true },
  })

  // Score each block's best facet
  const results: Candidate[] = []

  for (const block of blocks) {
    let best: Candidate | null = null
    for (const facet of block.facets) {
      let skills: string[] = []
      let bullets: string[] = []
      try { skills = JSON.parse(facet.skills) as string[] } catch { /* malformed legacy data */ }
      try { bullets = JSON.parse(facet.bulletPoints) as string[] } catch { /* malformed legacy data */ }
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
  let finalResults: FacetMatchResult[] = top.map(publicResult)

  if (ollamaStatus !== "offline" && top.length > 0) {
    try {
      const prompt = getMatchFacetsPrompt(analysis, top)
      const raw = await generate(prompt)
      const parsed = parseJSONResponse<{ rankedOrder: number[]; reasoning: Record<string, string> }>(raw)
      if (parsed?.rankedOrder) {
        const seen = new Set<number>()
        const reordered = parsed.rankedOrder
          .filter((n) => n >= 1 && n <= top.length)
          .filter((n) => !seen.has(n) && Boolean(seen.add(n)))
          .map((n) => {
            const item = top[n - 1]
            return { ...publicResult(item), reasoning: parsed.reasoning?.[n] || undefined }
          })
        if (reordered.length > 0) {
          const present = new Set(reordered.map((item) => item.facetId))
          finalResults = [...reordered, ...top.filter((item) => !present.has(item.facetId)).map(publicResult)]
        }
      }
    } catch { /* keep deterministic order */ }
  }

  // Coverage report
  const covered: Record<string, string> = {}
  const gaps: string[] = []
  for (const skill of analysis.requiredSkills) {
    const match = top.find((r) => r.skills.some((s) => skillsMatch(s, skill)))
    if (match) covered[skill] = match.facetId
    else gaps.push(skill)
  }

  const coverageReport: CoverageReport = { covered, gaps }

  return NextResponse.json({ recommendations: finalResults, coverageReport, jdAnalysis: analysis })
}
