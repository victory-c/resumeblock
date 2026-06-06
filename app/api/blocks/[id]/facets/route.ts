import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let body: {
    targetIndustry: string
    targetRoleType: string
    bulletPoints?: string[]
    skills?: string[]
    isDefault?: boolean
  }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  if (body.isDefault) {
    await prisma.facet.updateMany({
      where: { blockId: id },
      data: { isDefault: false },
    })
  }

  const facet = await prisma.facet.create({
    data: {
      blockId: id,
      targetIndustry: body.targetIndustry,
      targetRoleType: body.targetRoleType,
      bulletPoints: JSON.stringify(body.bulletPoints || []),
      skills: JSON.stringify(body.skills || []),
      isDefault: body.isDefault ?? false,
    },
  })

  return NextResponse.json({
    facet: {
      ...facet,
      bulletPoints: JSON.parse(facet.bulletPoints) as string[],
      skills: JSON.parse(facet.skills) as string[],
    },
  }, { status: 201 })
}
