import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  const jds = await prisma.jobDescription.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, companyName: true, roleTitle: true, createdAt: true },
  })
  return NextResponse.json({ jds })
}
