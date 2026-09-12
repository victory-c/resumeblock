import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { enforceLocalRequest, readLimitedJson } from "@/lib/compile-security"

const MAX_PROFILE_BYTES = 100_000

export async function GET(req: NextRequest) {
  const localOnlyError = enforceLocalRequest(req)
  if (localOnlyError) return localOnlyError
  const profile = await prisma.profile.findUnique({ where: { id: "default" } })
  if (!profile) return NextResponse.json({ data: {} })
  try { return NextResponse.json({ data: JSON.parse(profile.data) }) } catch {
    return NextResponse.json({ data: {} })
  }
}

export async function PUT(req: NextRequest) {
  const localOnlyError = enforceLocalRequest(req)
  if (localOnlyError) return localOnlyError
  const parsedBody = await readLimitedJson(req)
  if (parsedBody.response) return parsedBody.response
  if (!parsedBody.body || typeof parsedBody.body !== "object") {
    return NextResponse.json({ error: "Profile must be an object" }, { status: 400 })
  }
  const data = JSON.stringify(parsedBody.body)
  if (data.length > MAX_PROFILE_BYTES) {
    return NextResponse.json({ error: "Profile is too large" }, { status: 413 })
  }
  await prisma.profile.upsert({
    where: { id: "default" },
    create: { id: "default", data },
    update: { data },
  })
  return NextResponse.json({ saved: true })
}
