import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { enforceLocalRequest } from "@/lib/compile-security"

export async function GET(req: NextRequest) {
  const localOnlyError = enforceLocalRequest(req)
  if (localOnlyError) return localOnlyError
  const facets = await prisma.facet.findMany({ select: { skills: true } })
  const all: string[] = []
  for (const f of facets) {
    try {
      const parsed = JSON.parse(f.skills) as string[]
      all.push(...parsed)
    } catch { /* skip */ }
  }
  const deduped = Array.from(new Set(all.map((s) => s.toLowerCase().trim()).filter(Boolean))).sort()
  return NextResponse.json({ skills: deduped })
}
