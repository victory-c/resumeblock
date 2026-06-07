import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const facet = await prisma.facet.findUnique({ where: { id } })
  if (!facet) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (body.isDefault === true) {
    await prisma.facet.updateMany({
      where: { blockId: facet.blockId, id: { not: id } },
      data: { isDefault: false },
    })
  }

  const data: Record<string, unknown> = {}
  if (body.targetIndustry !== undefined) data.targetIndustry = body.targetIndustry
  if (body.targetRoleType !== undefined) data.targetRoleType = body.targetRoleType
  if (body.bulletPoints !== undefined) data.bulletPoints = JSON.stringify(body.bulletPoints)
  if (body.skills !== undefined) data.skills = JSON.stringify(body.skills)
  if (body.isDefault !== undefined) data.isDefault = body.isDefault

  const updated = await prisma.facet.update({ where: { id }, data })
  return NextResponse.json({
    facet: {
      ...updated,
      bulletPoints: JSON.parse(updated.bulletPoints) as string[],
      skills: JSON.parse(updated.skills) as string[],
    },
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const facet = await prisma.facet.findUnique({ where: { id } })
  if (!facet) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const count = await prisma.facet.count({ where: { blockId: facet.blockId } })
  if (count <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the only facet on a block" },
      { status: 400 }
    )
  }

  await prisma.facet.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
