import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pdfId: string }> }
) {
  const { pdfId } = await params
  const pdfPath = path.join(
    process.cwd(),
    process.env.OUTPUT_DIR || "./data/output",
    `${pdfId}.pdf`
  )

  if (!fs.existsSync(pdfPath)) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 })
  }

  const buffer = fs.readFileSync(pdfPath)
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="resume.pdf"`,
    },
  })
}
