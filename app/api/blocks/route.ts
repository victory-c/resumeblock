import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const search = searchParams.get("search")
  const sort = searchParams.get("sort") || "date_desc"

  const where: Prisma.BlockWhereInput = {}
  if (type && type !== "all") where.type = type
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { organization: { contains: search } },
    ]
  }

  const orderBy: Prisma.BlockOrderByWithRelationInput =
    sort === "date_asc"
      ? { startDate: "asc" }
      : sort === "updated"
      ? { updatedAt: "desc" }
      : { startDate: "desc" }

  const blocks = await prisma.block.findMany({
    where,
    orderBy,
    include: { _count: { select: { facets: true } } },
  })

  return NextResponse.json({ blocks })
}

export async function POST(req: NextRequest) {
  let body: { title: string; organization: string; location?: string; startDate: string; endDate?: string; type: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.title?.trim() || !body.organization?.trim()) {
    return NextResponse.json({ error: "title and organization are required" }, { status: 400 })
  }

  const startDate = new Date(body.startDate)
  if (isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "Invalid startDate" }, { status: 400 })
  }

  const endDate = body.endDate ? new Date(body.endDate) : null

  const block = await prisma.block.create({
    data: {
      title: body.title.trim(),
      organization: body.organization.trim(),
      location: body.location?.trim() || null,
      startDate,
      endDate,
      type: body.type || "other",
    },
    include: { _count: { select: { facets: true } } },
  })

  return NextResponse.json({ block }, { status: 201 })
}
