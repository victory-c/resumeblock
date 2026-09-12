import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import type { JDAnalysis } from "@/types"
import { enforceLocalRequest } from "@/lib/compile-security"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const localOnlyError = enforceLocalRequest(req)
  if (localOnlyError) return localOnlyError
  const { id } = await params
  const jd = await prisma.jobDescription.findUnique({ where: { id } })
  if (!jd) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let parsedRequirements: JDAnalysis | null = null
  try { parsedRequirements = JSON.parse(jd.parsedRequirements) } catch { /* empty */ }

  return NextResponse.json({ jd: { ...jd, parsedRequirements } })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const localOnlyError = enforceLocalRequest(req)
  if (localOnlyError) return localOnlyError
  const { id } = await params
  await prisma.jobDescription.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
