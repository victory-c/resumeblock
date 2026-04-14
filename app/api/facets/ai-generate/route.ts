import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkOllamaStatus, generate, parseJSONResponse } from "@/lib/ollama"
import { getGenerateFacetPrompt } from "@/lib/prompts/generate-facet"

export async function POST(req: NextRequest) {
  let body: { blockId: string; targetIndustry: string; targetRoleType: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const facets = await prisma.facet.findMany({
    where: { blockId: body.blockId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  })
  if (facets.length === 0) {
    return NextResponse.json({ error: "No facets found for this block" }, { status: 400 })
  }

  const defaultFacet = facets.find((f) => f.isDefault) || facets[0]
  const bullets = JSON.parse(defaultFacet.bulletPoints) as string[]

  const status = await checkOllamaStatus()
  if (status === "offline") {
    return NextResponse.json({ error: "llm_unavailable" }, { status: 503 })
  }

  const prompt = getGenerateFacetPrompt(bullets, body.targetIndustry, body.targetRoleType)
  let raw: string
  try {
    raw = await generate(prompt)
  } catch {
    return NextResponse.json({ error: "llm_unavailable" }, { status: 503 })
  }

  const result = parseJSONResponse<{ bulletPoints: string[]; skills: string[] }>(raw)
  if (!result) {
    return NextResponse.json({ error: "llm_unavailable" }, { status: 503 })
  }

  return NextResponse.json(result)
}
