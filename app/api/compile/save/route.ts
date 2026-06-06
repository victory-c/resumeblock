import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { enforceLocalCompileRequest, readLimitedJson } from "@/lib/compile-security"

export async function POST(req: NextRequest) {
  const localOnlyError = enforceLocalCompileRequest(req)
  if (localOnlyError) return localOnlyError

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
  const parsedBody = await readLimitedJson(req)
  if (parsedBody.response) return parsedBody.response
  body = parsedBody.body as typeof body

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
