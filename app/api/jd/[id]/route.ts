import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import type { JDAnalysis } from "@/types"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const jd = await prisma.jobDescription.findUnique({ where: { id } })
  if (!jd) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let parsedRequirements: JDAnalysis | null = null
  try { parsedRequirements = JSON.parse(jd.parsedRequirements) } catch { /* empty */ }

  return NextResponse.json({ jd: { ...jd, parsedRequirements } })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.jobDescription.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
