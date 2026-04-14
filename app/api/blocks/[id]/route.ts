import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

function parseFacets(facets: { bulletPoints: string; skills: string; [key: string]: unknown }[]) {
  return facets.map((f) => ({
    ...f,
    bulletPoints: JSON.parse(f.bulletPoints) as string[],
    skills: JSON.parse(f.skills) as string[],
  }))
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const block = await prisma.block.findUnique({
    where: { id: params.id },
    include: { facets: { orderBy: { createdAt: "asc" } } },
  })
  if (!block) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ block: { ...block, facets: parseFacets(block.facets) } })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = (body.title as string).trim()
  if (body.organization !== undefined) data.organization = (body.organization as string).trim()
  if (body.startDate !== undefined) data.startDate = new Date(body.startDate as string)
  if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate as string) : null
  if (body.location !== undefined) data.location = body.location ? (body.location as string).trim() : null
  if (body.type !== undefined) data.type = body.type

  const block = await prisma.block.update({ where: { id: params.id }, data })
  return NextResponse.json({ block })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.block.delete({ where: { id: params.id } })
  return NextResponse.json({ deleted: true })
}
