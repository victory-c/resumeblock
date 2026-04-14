import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  let body: {
    jobDescriptionId: string
    templateId: string
    selectedFacetIds: string[]
    additionalSections: Record<string, unknown>
    compiledLatex: string
    pdfPath?: string
    status?: string
    errorLog?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const compiled = await prisma.compiledResume.create({
    data: {
      jobDescriptionId: body.jobDescriptionId,
      templateId: body.templateId,
      selectedFacetIds: JSON.stringify(body.selectedFacetIds),
      additionalSections: JSON.stringify(body.additionalSections),
      compiledLatex: body.compiledLatex,
      pdfPath: body.pdfPath ?? null,
      status: body.status ?? "compiled",
      errorLog: body.errorLog ?? null,
    },
  })

  return NextResponse.json({ compiledResume: compiled }, { status: 201 })
}
