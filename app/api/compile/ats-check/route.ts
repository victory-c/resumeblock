import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { enforceLocalCompileRequest, readLimitedJson } from "@/lib/compile-security"
import type { JDAnalysis } from "@/types"

function stripLatex(latex: string): string {
  return latex
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/[{}\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function detectWarnings(latex: string): string[] {
  const warnings: string[] = []
  if (/\\begin\{tabular\}/i.test(latex)) {
    warnings.push("Table detected — ATS parsers often fail to read table content")
  }
  if (/\\includegraphics/i.test(latex)) {
    warnings.push("Image detected — ATS systems cannot read images")
  }
  return warnings
}

export async function POST(req: NextRequest) {
  const localOnlyError = enforceLocalCompileRequest(req)
  if (localOnlyError) return localOnlyError

  let body: { compiledLatex: string; jobDescriptionId: string }
  const parsedBody = await readLimitedJson(req)
  if (parsedBody.response) return parsedBody.response
  body = parsedBody.body as typeof body

  const jd = await prisma.jobDescription.findUnique({ where: { id: body.jobDescriptionId } })
  if (!jd) return NextResponse.json({ error: "JD not found" }, { status: 404 })

  let analysis: JDAnalysis | null = null
  try {
    analysis = JSON.parse(jd.parsedRequirements) as JDAnalysis
  } catch {
    return NextResponse.json({ error: "Invalid JD analysis" }, { status: 400 })
  }

  const plainText = stripLatex(body.compiledLatex).toLowerCase()
  const keywords = analysis.atsKeywords ?? []
  const found: string[] = []
  const missing: string[] = []

  for (const kw of keywords) {
    const pattern = new RegExp(`\\b${kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`)
    if (pattern.test(plainText)) {
      found.push(kw)
    } else {
      missing.push(kw)
    }
  }

  const coverage = keywords.length === 0 ? 100 : Math.round((found.length / keywords.length) * 100)
  const warnings = detectWarnings(body.compiledLatex)

  return NextResponse.json({ coverage, found, missing, warnings })
}
