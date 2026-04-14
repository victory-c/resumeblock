import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { escapeLatex, formatBulletPoints, formatBulletPointsDeedy, formatDateRange, injectPlaceholder } from "@/lib/latex"
import type { AdditionalSections, SkillCategory } from "@/types"
import fs from "fs"
import path from "path"
import { execSync } from "child_process"
import { randomUUID } from "crypto"

// ---------- Standard template builders ----------

function buildExperienceSection(facets: Array<{ block: { title: string; organization: string; location?: string | null; startDate: Date; endDate: Date | null }; bulletPoints: string[] }>): string {
  return facets.map((f) => {
    const bullets = formatBulletPoints(f.bulletPoints)
    return `\\subsection*{${escapeLatex(f.block.title)}}
\\textit{${escapeLatex(f.block.organization)}} \\hfill ${escapeLatex(formatDateRange(f.block.startDate, f.block.endDate))}
${bullets}`
  }).join("\n\n")
}

function buildHeader(header: AdditionalSections["header"]): string {
  const lines = [
    `\\textbf{\\Large ${escapeLatex(header.name)}}\\\\`,
    header.email ? `\\href{mailto:${header.email}}{${escapeLatex(header.email)}}` : "",
    header.phone ? escapeLatex(header.phone) : "",
    header.linkedin ? `\\href{${header.linkedin}}{LinkedIn}` : "",
    header.github ? `\\href{${header.github}}{GitHub}` : "",
    header.portfolio ? `\\href{${header.portfolio}}{Portfolio}` : "",
  ].filter(Boolean)
  return lines.join(" $|$ ")
}

// ---------- Deedy template builders ----------

function buildExperienceSectionDeedy(facets: Array<{ block: { title: string; organization: string; location?: string | null; startDate: Date; endDate: Date | null }; bulletPoints: string[] }>): string {
  return facets.map((f) => {
    const bullets = formatBulletPointsDeedy(f.bulletPoints)
    const dateLoc = [
      formatDateRange(f.block.startDate, f.block.endDate),
      f.block.location || "",
    ].filter(Boolean).join(" | ")
    return `\\runsubsection{${escapeLatex(f.block.organization)}}
\\descript{| ${escapeLatex(f.block.title)}}
\\location{${escapeLatex(dateLoc)}}
${bullets}
\\sectionsep`
  }).join("\n\n")
}

function buildHeaderDeedy(header: AdditionalSections["header"]): string {
  const contact = [
    header.email ? `\\href{mailto:${header.email}}{${escapeLatex(header.email)}}` : "",
    header.phone ? escapeLatex(header.phone) : "",
  ].filter(Boolean).join(" | ")
  return `{\\fontsize{28pt}{34pt}\\selectfont\\textbf{${escapeLatex(header.name)}}}\\\\
\\vspace{4pt}
${contact}`
}

function buildSkillsCategorized(categories: SkillCategory[]): string {
  if (categories.length === 0) return ""
  return categories.map((cat) => {
    const items = cat.items.map(escapeLatex).join(" \\textbullet{} ")
    return `\\subsection*{${escapeLatex(cat.name)}}
${items}`
  }).join("\n\\sectionsep\n")
}

function buildCoursework(coursework: string): string {
  if (!coursework.trim()) return ""
  const lines = coursework.split("\n").filter((l) => l.trim())
  return lines.map((l) => escapeLatex(l.trim())).join(" \\\\\n")
}

function buildSocieties(societies: string[]): string {
  if (societies.length === 0) return ""
  return societies.map((s) => escapeLatex(s.trim())).join(" \\\\\n")
}

function buildLinks(header: AdditionalSections["header"]): string {
  const links: string[] = []
  if (header.github) {
    const username = header.github.replace(/^https?:\/\/(www\.)?github\.com\/?/, "").replace(/\/$/, "") || header.github
    links.push(`Github:// \\href{${header.github}}{\\textbf{${escapeLatex(username)}}}`)
  }
  if (header.linkedin) {
    const username = header.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, "").replace(/\/$/, "") || header.linkedin
    links.push(`LinkedIn:// \\href{${header.linkedin}}{\\textbf{${escapeLatex(username)}}}`)
  }
  if (header.portfolio) {
    const display = header.portfolio.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
    links.push(`Portfolio:// \\href{${header.portfolio}}{\\textbf{${escapeLatex(display)}}}`)
  }
  if (links.length === 0) return ""
  return links.join(" \\\\\n")
}

// ---------- Template format detection ----------

function isDeedy(latexSource: string): boolean {
  return latexSource.includes("%%LINKS%%") || latexSource.includes("%%COURSEWORK%%") || latexSource.includes("%%SOCIETIES%%")
}

// ---------- Main handler ----------

export async function POST(req: NextRequest) {
  let body: { templateId: string; facetIds: string[]; additionalSections: AdditionalSections; jobDescriptionId?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const template = await prisma.template.findUnique({ where: { id: body.templateId } })
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 })

  const facets = await prisma.facet.findMany({
    where: { id: { in: body.facetIds } },
    include: { block: true },
  })

  const parsed = facets.map((f) => ({
    ...f,
    bulletPoints: JSON.parse(f.bulletPoints) as string[],
    skills: JSON.parse(f.skills) as string[],
  }))

  const byType = {
    work: parsed.filter((f) => f.block.type === "work" || f.block.type === "volunteer"),
    education: parsed.filter((f) => f.block.type === "education"),
    project: parsed.filter((f) => f.block.type === "project"),
  }

  const allSkills = Array.from(new Set([
    ...parsed.flatMap((f) => f.skills),
    ...(body.additionalSections.skills || []),
  ]))

  // Assemble LaTeX
  let latex = template.latexSource
  const s = body.additionalSections
  const deedy = isDeedy(latex)

  // Header
  latex = injectPlaceholder(latex, "HEADER", deedy ? buildHeaderDeedy(s.header) : buildHeader(s.header))

  // Experience
  const experienceContent = deedy ? buildExperienceSectionDeedy(byType.work) : buildExperienceSection(byType.work)
  latex = injectPlaceholder(latex, "EXPERIENCE", experienceContent ? `\\section{Experience}\n${experienceContent}` : "")

  // Education
  const educationRaw = deedy ? buildExperienceSectionDeedy(byType.education) : buildExperienceSection(byType.education)
  const educationContent = byType.education.length > 0 ? educationRaw : (s.education ? escapeLatex(s.education) : "")
  latex = injectPlaceholder(latex, "EDUCATION", educationContent ? `\\section{Education}\n${educationContent}` : "")

  // Projects
  const projectsContent = deedy ? buildExperienceSectionDeedy(byType.project) : buildExperienceSection(byType.project)
  latex = injectPlaceholder(latex, "PROJECTS", projectsContent ? `\\section{Projects}\n${projectsContent}` : "")

  // Skills
  if (deedy && s.skillCategories && s.skillCategories.length > 0) {
    const skillsCatContent = buildSkillsCategorized(s.skillCategories)
    latex = injectPlaceholder(latex, "SKILLS", skillsCatContent ? `\\section{Skills}\n${skillsCatContent}` : "")
  } else {
    const skillsContent = allSkills.map(escapeLatex).join(", ")
    latex = injectPlaceholder(latex, "SKILLS", skillsContent ? `\\section{Skills}\n${skillsContent}` : "")
  }

  // Summary (standard templates only — Deedy typically doesn't have summary)
  const summaryContent = s.summary ? escapeLatex(s.summary) : ""
  latex = injectPlaceholder(latex, "SUMMARY", summaryContent ? `\\section{Summary}\n${summaryContent}` : "")

  // Deedy-only sections
  const courseworkContent = s.coursework ? buildCoursework(s.coursework) : ""
  latex = injectPlaceholder(latex, "COURSEWORK", courseworkContent ? `\\section{Coursework}\n${courseworkContent}` : "")

  const societiesContent = s.societies && s.societies.length > 0 ? buildSocieties(s.societies) : ""
  latex = injectPlaceholder(latex, "SOCIETIES", societiesContent ? `\\section{Societies}\n${societiesContent}` : "")

  const linksContent = buildLinks(s.header)
  latex = injectPlaceholder(latex, "LINKS", linksContent ? `\\section{Links}\n${linksContent}` : "")

  // Custom sections
  if (s.custom) {
    for (const [key, val] of Object.entries(s.custom)) {
      latex = injectPlaceholder(latex, `CUSTOM:${key.toUpperCase()}`, escapeLatex(val))
    }
  }

  // Compile
  const outputDir = path.join(process.cwd(), process.env.OUTPUT_DIR || "./data/output")
  const uuid = randomUUID()
  const tmpDir = path.join(outputDir, `tmp_${uuid}`)
  fs.mkdirSync(tmpDir, { recursive: true })

  const texPath = path.join(tmpDir, "resume.tex")
  fs.writeFileSync(texPath, latex, "utf8")

  // Resolve pdflatex binary: check known absolute paths first, fall back to PATH
  const knownPaths = [
    "/Library/TeX/texbin/pdflatex",          // macOS MacTeX
    "/usr/local/texlive/2026/bin/universal-darwin/pdflatex", // macOS TeX Live 2026
    "/usr/local/texlive/2025/bin/universal-darwin/pdflatex", // macOS TeX Live 2025
    "/usr/local/texlive/2024/bin/x86_64-linux/pdflatex",     // Linux TeX Live 2024
    "/usr/local/texlive/2025/bin/x86_64-linux/pdflatex",     // Linux TeX Live 2025
    "/usr/bin/pdflatex",                      // Ubuntu/Debian apt install texlive
    "/usr/texbin/pdflatex",                   // macOS legacy
  ]
  const pdflatexBin = knownPaths.find((p) => { try { return fs.existsSync(p) } catch { return false } }) ?? "pdflatex"

  try {
    execSync(`"${pdflatexBin}" -interaction=nonstopmode -output-directory="${tmpDir}" "${texPath}"`, {
      timeout: 30000,
      stdio: "pipe",
    })
  } catch (e) {
    const logPath = path.join(tmpDir, "resume.log")
    let errorLog = "Compilation failed"
    let problemLine: string | undefined
    if (fs.existsSync(logPath)) {
      const log = fs.readFileSync(logPath, "utf8")
      errorLog = log.slice(0, 3000)
      const errLine = log.split("\n").find((l) => l.startsWith("! "))
      if (errLine) problemLine = errLine
    } else if ((e as Error).message.includes("ENOENT") || (e as Error).message.includes("not found")) {
      errorLog = "pdflatex not found. Please install TeX Live:\n  macOS: brew install --cask mactex-no-gui\n  Or compile the .tex file on Overleaf (overleaf.com)"
      problemLine = "pdflatex not installed"
    }
    try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch { /* ignore */ }
    return NextResponse.json({ status: "error", errorLog, problemLine, compiledLatex: latex })
  }

  const pdfSrc = path.join(tmpDir, "resume.pdf")
  const pdfDest = path.join(outputDir, `${uuid}.pdf`)

  if (!fs.existsSync(pdfSrc)) {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch { /* ignore */ }
    return NextResponse.json({ status: "error", errorLog: "PDF not generated", compiledLatex: latex })
  }

  fs.copyFileSync(pdfSrc, pdfDest)
  try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch { /* ignore */ }

  return NextResponse.json({ status: "success", pdfId: uuid, compiledLatex: latex })
}
