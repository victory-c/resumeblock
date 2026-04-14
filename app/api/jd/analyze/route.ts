import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkOllamaStatus, generate, parseJSONResponse } from "@/lib/ollama"
import { getAnalyzeJDPrompt } from "@/lib/prompts/analyze-jd"
import type { JDAnalysis } from "@/types"

export async function POST(req: NextRequest) {
  let body: { rawText: string; companyName?: string; roleTitle?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  if (!body.rawText?.trim()) {
    return NextResponse.json({ error: "rawText is required" }, { status: 400 })
  }

  const truncated = body.rawText.slice(0, 4000)

  const status = await checkOllamaStatus()
  if (status === "offline") {
    return NextResponse.json({ error: "llm_unavailable" }, { status: 503 })
  }

  const prompt = getAnalyzeJDPrompt(truncated)
  let raw: string
  try {
    raw = await generate(prompt)
  } catch {
    return NextResponse.json({ error: "llm_unavailable" }, { status: 503 })
  }

  const analysis = parseJSONResponse<JDAnalysis>(raw)
  if (!analysis) {
    return NextResponse.json({ error: "llm_unavailable" }, { status: 503 })
  }

  // Post-process: remove location strings and generic words from atsKeywords
  const LOCATION_PATTERN = /\b(CA|NY|TX|WA|FL|MA|IL|GA|CO|OH|NC|VA|remote|hybrid|on-site|onsite)\b|,\s*[A-Z]{2}\b/i
  const GENERIC_WORDS = /^(team|communication|work|business|office|company|experience|years|degree|skills|role|position|job|detail|oriented|ability|strong|excellent|good)$/i
  analysis.atsKeywords = (analysis.atsKeywords || []).filter(
    (kw) => typeof kw === "string" && kw.length >= 3 && kw.split(" ").length <= 5 && !LOCATION_PATTERN.test(kw) && !GENERIC_WORDS.test(kw.trim())
  )

  const jd = await prisma.jobDescription.create({
    data: {
      companyName: body.companyName || analysis.industry || "Unknown",
      roleTitle: body.roleTitle || analysis.roleType || "Unknown",
      rawText: body.rawText,
      parsedRequirements: JSON.stringify(analysis),
    },
  })

  return NextResponse.json({ jobDescriptionId: jd.id, analysis })
}
