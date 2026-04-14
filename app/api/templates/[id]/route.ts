import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import fs from "fs"
import path from "path"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const template = await prisma.template.findUnique({ where: { id: params.id } })
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ template })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.template.delete({ where: { id: params.id } })
  try {
    const filePath = path.join(process.cwd(), process.env.TEMPLATES_DIR || "./data/templates", `${params.id}.tex`)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch { /* ignore file errors */ }
  return NextResponse.json({ deleted: true })
}
