import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _req: NextRequest,
  { params }: { params: { pdfId: string } }
) {
  // pdfIds are server-generated UUIDs (randomUUID). Reject anything else to
  // prevent path traversal via crafted ids.
  if (!UUID_RE.test(params.pdfId)) {
    return NextResponse.json({ error: "Invalid PDF id" }, { status: 400 })
  }

  const outputDir = path.resolve(
    process.cwd(),
    process.env.OUTPUT_DIR || "./data/output"
  )
  const pdfPath = path.resolve(outputDir, `${params.pdfId}.pdf`)

  // Defense in depth: ensure the resolved path stays inside the output dir.
  if (pdfPath !== path.join(outputDir, `${params.pdfId}.pdf`)) {
    return NextResponse.json({ error: "Invalid PDF id" }, { status: 400 })
  }

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
