import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { detectPlaceholders } from "@/lib/latex"
import { enforceLocalRequest } from "@/lib/compile-security"
import fs from "fs"
import path from "path"

export async function GET(req: NextRequest) {
  const localOnlyError = enforceLocalRequest(req)
  if (localOnlyError) return localOnlyError

  const templates = await prisma.template.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, placeholderFormat: true, previewImagePath: true, createdAt: true, updatedAt: true },
  })
  return NextResponse.json({ templates })
}

export async function POST(req: NextRequest) {
  const localOnlyError = enforceLocalRequest(req)
  if (localOnlyError) return localOnlyError

  let name: string
  let latexSource: string

  try {
    const fd = await req.formData()
    name = (fd.get("name") as string | null)?.trim() || ""
    const file = fd.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
    if (!file.name.endsWith(".tex")) return NextResponse.json({ error: "File must be a .tex file" }, { status: 400 })
    latexSource = await file.text()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })
  if (!latexSource.trim()) return NextResponse.json({ error: "Template file is empty" }, { status: 400 })

  // Warn if the template uses a non-standard document class
  const classMatch = latexSource.match(/\\documentclass(?:\[.*?\])?\{([^}]+)\}/)
  const standardClasses = ["article", "report", "book", "letter", "beamer", "scrartcl", "memoir"]
  const customClass = classMatch && !standardClasses.includes(classMatch[1]) ? classMatch[1] : null

  const placeholders = detectPlaceholders(latexSource)

  const template = await prisma.template.create({
    data: {
      name,
      latexSource,
      placeholderFormat: JSON.stringify(placeholders),
    },
  })

  // Write to disk for compilation
  const templatesDir = path.join(process.cwd(), process.env.TEMPLATES_DIR || "./data/templates")
  fs.mkdirSync(templatesDir, { recursive: true })
  fs.writeFileSync(path.join(templatesDir, `${template.id}.tex`), latexSource, "utf8")

  const { latexSource: _, ...rest } = template
  return NextResponse.json({
    template: rest,
    ...(customClass ? { warning: `Template uses custom document class "${customClass}". It requires the corresponding .cls file to compile. Consider using article-based templates with %%PLACEHOLDER%% markers, or compile via Overleaf.` } : {}),
  }, { status: 201 })
}
