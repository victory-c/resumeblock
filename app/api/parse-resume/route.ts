import { NextRequest, NextResponse } from "next/server"
import { checkOllamaStatus, generate, parseJSONResponse } from "@/lib/ollama"
import { getParseResumePrompt } from "@/lib/prompts/parse-resume"
import { enforceLocalRequest } from "@/lib/compile-security"
import type { ParsedResumeEntry } from "@/types"

export async function POST(req: NextRequest) {
  const localOnlyError = enforceLocalRequest(req)
  if (localOnlyError) return localOnlyError

  let file: File | null = null

  try {
    const formData = await req.formData()
    file = formData.get("file") as File | null
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid form data" }, { status: 400 })
  }

  if (!file) {
    return NextResponse.json({ status: "error", message: "No file provided" }, { status: 400 })
  }

  // Validate PDF
  const contentType = file.type
  const filename = file.name || ""
  const isPdf = contentType === "application/pdf" || filename.toLowerCase().endsWith(".pdf")
  if (!isPdf) {
    return NextResponse.json({ status: "error", message: "File must be a PDF" }, { status: 400 })
  }

  // Read buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Extract text with pdf-parse
  // Use the internal lib directly to bypass the debug code in index.js
  // which reads a test file on load and throws ENOENT in Next.js context
  let rawText = ""
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse/lib/pdf-parse") as (buf: Buffer) => Promise<{ text: string }>
    const data = await pdfParse(buffer)
    rawText = data.text
  } catch {
    return NextResponse.json(
      {
        status: "extraction_failed",
        rawText: "",
        message: "Failed to parse PDF file",
      },
      { status: 200 }
    )
  }

  // Check extracted text quality
  if (rawText.trim().length < 100) {
    return NextResponse.json({
      status: "extraction_failed",
      rawText,
      message: "Poor PDF text extraction — the file may be image-based or scanned. Try a text-based PDF.",
    })
  }

  // Check Ollama status
  const ollamaStatus = await checkOllamaStatus()
  if (ollamaStatus === "offline") {
    return NextResponse.json({ status: "llm_unavailable", rawText })
  }

  // Build and send prompt
  const prompt = getParseResumePrompt(rawText)

  let raw: string
  try {
    raw = await generate(prompt)
  } catch {
    return NextResponse.json({ status: "llm_unavailable", rawText })
  }

  // Prompt ends with "{" so prepend it to complete the object
  const rawObj = raw.trimStart().startsWith("{") ? raw : "{" + raw
  const parsed = parseJSONResponse<{ entries: ParsedResumeEntry[]; languages: string[] }>(rawObj)
  if (!parsed || !Array.isArray(parsed.entries) || parsed.entries.length === 0) {
    return NextResponse.json({ status: "llm_unavailable", rawText })
  }

  const ACTION_VERB = /^(Developed|Led|Built|Created|Managed|Designed|Implemented|Worked|Collaborated|Contributed|Responsible|Spearheaded|Drove|Established|Delivered|Launched)/i
  const valid = parsed.entries
    .filter((e) => e.title?.trim())
    .map((e) => ({
      ...e,
      needsReview: e.needsReview || ACTION_VERB.test(e.title.trim()) || e.title.trim().length > 60,
    }))

  const languages = (parsed.languages || []).filter((l): l is string => typeof l === "string" && l.trim().length > 0)

  return NextResponse.json({ status: "success", entries: valid, languages, rawText })
}
