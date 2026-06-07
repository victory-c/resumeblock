import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generate, parseJSONResponse } from "@/lib/ollama"
import { enforceLocalCompileRequest, readLimitedJson } from "@/lib/compile-security"
import type { JDAnalysis } from "@/types"

export async function POST(req: NextRequest) {
  const localOnlyError = enforceLocalCompileRequest(req)
  if (localOnlyError) return localOnlyError

  let body: { jobDescriptionId: string; facetIds: string[] }
  const parsedBody = await readLimitedJson(req)
  if (parsedBody.response) return parsedBody.response
  body = parsedBody.body as typeof body

  const jd = await prisma.jobDescription.findUnique({ where: { id: body.jobDescriptionId } })
  if (!jd) return NextResponse.json({ error: "JD not found" }, { status: 404 })

  const facets = await prisma.facet.findMany({
    where: { id: { in: body.facetIds } },
    include: { block: true },
  })

  let analysis: JDAnalysis | null = null
  try {
    analysis = JSON.parse(jd.parsedRequirements) as JDAnalysis
  } catch { /* empty */ }

  const allBullets = facets.flatMap((f) => {
    try { return JSON.parse(f.bulletPoints) as string[] } catch { return [] }
  }).slice(0, 10)

  const prompt = `You are a professional resume writer. Write a 2-3 sentence professional summary for a resume.

Role: ${jd.roleTitle} at ${jd.companyName}
${analysis ? `Industry: ${analysis.industry}\nExperience Level: ${analysis.experienceLevel}\nKey Skills Required: ${analysis.requiredSkills.slice(0, 8).join(", ")}` : ""}

Candidate's key bullet points:
${allBullets.map((b) => `- ${b}`).join("\n")}

Return ONLY JSON: { "summary": string }
The summary should be 2-3 sentences, highlight relevant skills and experience, and be tailored to the role.`

  try {
    const raw = await generate(prompt)
    const parsed = parseJSONResponse<{ summary: string }>(raw)
    if (parsed?.summary) {
      return NextResponse.json({ summary: parsed.summary })
    }
    // Fallback: return raw trimmed text if JSON parse fails
    return NextResponse.json({ summary: raw.trim().slice(0, 500) })
  } catch {
    return NextResponse.json({ error: "Ollama unavailable" }, { status: 503 })
  }
}
