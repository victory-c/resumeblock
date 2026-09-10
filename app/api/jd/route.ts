import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { enforceLocalRequest } from "@/lib/compile-security"

export async function GET(req: NextRequest) {
  const localOnlyError = enforceLocalRequest(req)
  if (localOnlyError) return localOnlyError
  const jds = await prisma.jobDescription.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, companyName: true, roleTitle: true, createdAt: true },
  })
  return NextResponse.json({ jds })
}
