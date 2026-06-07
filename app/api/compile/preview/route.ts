import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import {
  escapeLatex,
  formatBulletPoints,
  formatBulletPointsDeedy,
  formatDateRange,
  injectPlaceholder,
  renderLatexHref,
  renderLatexMailtoHref,
  validateAdditionalSectionsLatexHrefs,
  validateLatexHttpHref,
} from "@/lib/latex"
import {
  enforceLocalCompileRequest,
  readLimitedJson,
  tryAcquireCompileSlot,
} from "@/lib/compile-security"
import type { AdditionalSections, SkillCategory } from "@/types"
import fs from "fs"
import path from "path"
import { spawn } from "child_process"
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
    header.email ? renderLatexMailtoHref(header.email, header.email, "additionalSections.header.email") : "",
    header.phone ? escapeLatex(header.phone) : "",
    header.linkedin ? renderLatexHref(header.linkedin, "LinkedIn", "additionalSections.header.linkedin") : "",
    header.github ? renderLatexHref(header.github, "GitHub", "additionalSections.header.github") : "",
    header.portfolio ? renderLatexHref(header.portfolio, "Portfolio", "additionalSections.header.portfolio") : "",
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
    header.email ? renderLatexMailtoHref(header.email, header.email, "additionalSections.header.email") : "",
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
    const href = validateLatexHttpHref(header.github, "additionalSections.header.github")
    const username = href.replace(/^https?:\/\/(www\.)?github\.com\/?/, "").replace(/\/$/, "") || href
    links.push(`Github:// \\href{${href}}{\\textbf{${escapeLatex(username)}}}`)
  }
  if (header.linkedin) {
    const href = validateLatexHttpHref(header.linkedin, "additionalSections.header.linkedin")
    const username = href.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, "").replace(/\/$/, "") || href
    links.push(`LinkedIn:// \\href{${href}}{\\textbf{${escapeLatex(username)}}}`)
  }
  if (header.portfolio) {
    const href = validateLatexHttpHref(header.portfolio, "additionalSections.header.portfolio")
    const display = href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
    links.push(`Portfolio:// \\href{${href}}{\\textbf{${escapeLatex(display)}}}`)
  }
  if (links.length === 0) return ""
  return links.join(" \\\\\n")
}

// ---------- Template format detection ----------

function isDeedy(latexSource: string): boolean {
  return latexSource.includes("%%LINKS%%") || latexSource.includes("%%COURSEWORK%%") || latexSource.includes("%%SOCIETIES%%")
}

async function runPdfLatex(pdflatexBin: string, tmpDir: string, texPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      pdflatexBin,
      [
        "-interaction=nonstopmode",
        "-no-shell-escape",
        `-output-directory=${tmpDir}`,
        texPath,
      ],
      {
        stdio: "pipe",
        env: {
          ...process.env,
          openin_any: "p",
          openout_any: "p",
        },
      }
    )

    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      proc.kill("SIGKILL")
      reject(new Error("pdflatex timed out"))
    }, 30000)

    proc.on("error", (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(error)
    })

    proc.on("close", (exitCode) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (exitCode === 0) {
        resolve()
      } else {
        reject(new Error(`pdflatex exited with code ${exitCode}`))
      }
    })
  })
}

// ---------- Main handler ----------

export async function POST(req: NextRequest) {
  const localOnlyError = enforceLocalCompileRequest(req)
  if (localOnlyError) return localOnlyError

  let body: { templateId: string; facetIds: string[]; additionalSections: AdditionalSections; jobDescriptionId?: string }
  const parsedBody = await readLimitedJson(req)
  if (parsedBody.response) return parsedBody.response
  body = parsedBody.body as typeof body

  const hrefErrors = validateAdditionalSectionsLatexHrefs(body.additionalSections)
  if (hrefErrors.length > 0) {
    return NextResponse.json(
      { error: "Invalid link URL", fields: hrefErrors },
      { status: 400 }
    )
  }

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

  const releaseCompileSlot = tryAcquireCompileSlot()
  if (!releaseCompileSlot) {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch { /* ignore */ }
    return NextResponse.json({ error: "Too many compile requests" }, { status: 429 })
  }

  try {
    await runPdfLatex(pdflatexBin, tmpDir, texPath)
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
  } finally {
    releaseCompileSlot()
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
