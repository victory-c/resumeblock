import type { Block, Facet } from "@prisma/client"

// ----- Block & Facet -----

export type BlockWithFacets = Block & {
  facets: Facet[]
}

export type ParsedFacet = Omit<Facet, "bulletPoints" | "skills"> & {
  bulletPoints: string[]
  skills: string[]
}

export type BlockWithParsedFacets = Block & {
  facets: ParsedFacet[]
}

// ----- Module 1: Resume Parser -----

export type ParsedResumeEntry = {
  title: string
  organization: string
  location?: string
  startDate: string // "YYYY-MM-DD" or "unknown"
  endDate: string | null // "YYYY-MM-DD", null, or "unknown"
  type: "work" | "project" | "volunteer" | "education" | "award" | "society" | "club" | "publicService" | "other"
  bulletPoints: string[]
  needsReview: boolean
  // Added by user during review
  targetIndustry?: string
  targetRoleType?: string
}

export type ParseResumeResponse =
  | { status: "success"; entries: ParsedResumeEntry[]; rawText: string; languages: string[] }
  | { status: "extraction_failed"; rawText: string; message: string }
  | { status: "llm_unavailable"; rawText: string }
  | { status: "error"; message: string }

// ----- Module 3: JD Interpreter -----

export type JDAnalysis = {
  requiredSkills: string[]
  preferredSkills: string[]
  keyResponsibilities: string[]
  experienceLevel: "entry" | "mid" | "senior" | "unknown"
  industry: string
  roleType: string
  atsKeywords: string[]
  culturalSignals: string[]
  confidence: "high" | "medium" | "low"
}

export type FacetMatchResult = {
  blockId: string
  facetId: string
  blockTitle: string
  blockOrganization: string
  facetIndustry: string
  facetRoleType: string
  totalScore: number
  skillScore: number
  industryScore: number
  roleTypeScore: number
  reasoning?: string
  included: boolean
}

export type CoverageReport = {
  covered: Record<string, string> // skill -> facetId
  gaps: string[]
}

// ----- Module 4: LaTeX Compiler -----

export type LatexCompileResult =
  | { status: "success"; pdfPath: string; compiledLatex: string }
  | { status: "error"; errorLog: string; problemLine?: string; compiledLatex: string }

export type HeaderInfo = {
  name: string
  email: string
  phone?: string
  linkedin?: string
  github?: string
  portfolio?: string
}

export type SkillCategory = {
  name: string       // e.g. "Programming", "Technology"
  items: string[]    // e.g. ["Python", "C++", "JavaScript"]
}

export type AdditionalSections = {
  header: HeaderInfo
  summary?: string
  skills?: string[]
  skillCategories?: SkillCategory[]
  education?: string
  coursework?: string
  societies?: string[]
  custom?: Record<string, string>
}

export type CompilePayload = {
  jdId?: string
  facetIds: string[]
  blockOrder: string[]
}

// ----- LLM Status -----

export type OllamaStatus = "ready" | "loading" | "offline"
