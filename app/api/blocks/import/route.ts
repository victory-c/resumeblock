import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { enforceLocalRequest } from "@/lib/compile-security"
import type { ParsedResumeEntry } from "@/types"

type ImportEntry = ParsedResumeEntry & {
  targetIndustry: string
  targetRoleType: string
}

function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr === "unknown" || dateStr === "null") return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

export async function POST(req: NextRequest) {
  const localOnlyError = enforceLocalRequest(req)
  if (localOnlyError) return localOnlyError

  let entries: ImportEntry[]
  let languages: string[] = []
  try {
    const body = await req.json()
    entries = body.entries as ImportEntry[]
    languages = Array.isArray(body.languages) ? body.languages : []
    if (!Array.isArray(entries)) throw new Error("entries must be an array")
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const invalid = entries.filter((e) => !e.title?.trim() || !e.organization?.trim())
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: "Each entry must have title and organization" },
      { status: 400 }
    )
  }

  let blockCount = 0
  let facetCount = 0
  const blockIds: string[] = []

  for (const entry of entries) {
    const startDate = parseDate(entry.startDate) || new Date()
    const endDate = parseDate(entry.endDate)

    const block = await prisma.block.create({
      data: {
        title: entry.title.trim(),
        organization: entry.organization.trim(),
        location: entry.location?.trim() || null,
        startDate,
        endDate,
        type: entry.type || "other",
      },
    })
    blockCount++
    blockIds.push(block.id)

    await prisma.facet.create({
      data: {
        blockId: block.id,
        targetIndustry: entry.targetIndustry?.trim() || "General",
        targetRoleType: entry.targetRoleType?.trim() || "General",
        bulletPoints: JSON.stringify(entry.bulletPoints || []),
        skills: JSON.stringify([]),
        isDefault: true,
      },
    })
    facetCount++
  }

  // Store languages as a single "Languages" block with type "other"
  if (languages.length > 0) {
    const langBlock = await prisma.block.create({
      data: {
        title: "Languages",
        organization: "Personal",
        startDate: new Date(),
        endDate: null,
        type: "other",
      },
    })
    blockIds.push(langBlock.id)
    blockCount++
    await prisma.facet.create({
      data: {
        blockId: langBlock.id,
        targetIndustry: "General",
        targetRoleType: "General",
        bulletPoints: JSON.stringify(languages),
        skills: JSON.stringify(languages),
        isDefault: true,
      },
    })
    facetCount++
  }

  return NextResponse.json({ created: { blocks: blockCount, facets: facetCount }, blockIds })
}
