import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import fs from "fs"
import path from "path"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const template = await prisma.template.findUnique({ where: { id } })
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ template })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.template.delete({ where: { id } })
  try {
    const filePath = path.join(process.cwd(), process.env.TEMPLATES_DIR || "./data/templates", `${id}.tex`)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch { /* ignore file errors */ }
  return NextResponse.json({ deleted: true })
}
