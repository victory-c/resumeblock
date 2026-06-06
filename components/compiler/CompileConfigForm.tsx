"use client"

import Link from "next/link"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CompileSummaryAI } from "./CompileSummaryAI"
import type { HeaderInfo, AdditionalSections, SkillCategory } from "@/types"
import { Plus, Trash2 } from "lucide-react"

const HEADER_KEY = "resumeblock_header"

interface Template {
  id: string
  name: string
}

interface CompileConfigFormProps {
  templates: Template[]
  facetIds: string[]
  jdId?: string
  onSubmit: (templateId: string, additionalSections: AdditionalSections) => void
  loading: boolean
}

function loadHeader(): HeaderInfo {
  if (typeof window === "undefined") return { name: "", email: "" }
  try {
    const saved = localStorage.getItem(HEADER_KEY)
    if (saved) return JSON.parse(saved) as HeaderInfo
  } catch { /* empty */ }
  return { name: "", email: "" }
}

export function CompileConfigForm({ templates, facetIds, jdId, onSubmit, loading }: CompileConfigFormProps) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "")
  const [header, setHeader] = useState<HeaderInfo>(() => loadHeader())
  const [summary, setSummary] = useState("")
  const [skillsInput, setSkillsInput] = useState("")
  const [useSkillCategories, setUseSkillCategories] = useState(false)
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([
    { name: "Programming", items: [] },
    { name: "Technology", items: [] },
  ])
  const [coursework, setCoursework] = useState("")
  const [societies, setSocieties] = useState("")

  function updateHeader(field: keyof HeaderInfo, value: string) {
    const next = { ...header, [field]: value }
    setHeader(next)
    localStorage.setItem(HEADER_KEY, JSON.stringify(next))
  }

  function updateCategory(index: number, field: keyof SkillCategory, value: string | string[]) {
    setSkillCategories((prev) => prev.map((cat, i) => i === index ? { ...cat, [field]: value } : cat))
  }

  function addCategory() {
    setSkillCategories((prev) => [...prev, { name: "", items: [] }])
  }

  function removeCategory(index: number) {
    setSkillCategories((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    if (!templateId) return
    const skills = skillsInput ? skillsInput.split(",").map((s) => s.trim()).filter(Boolean) : []
    const societiesList = societies ? societies.split("\n").map((s) => s.trim()).filter(Boolean) : []

    const validCategories = skillCategories
      .filter((c) => c.name.trim() && c.items.length > 0)
      .map((c) => ({ name: c.name.trim(), items: c.items }))

    const additionalSections: AdditionalSections = {
      header,
      ...(summary ? { summary } : {}),
      ...(skills.length ? { skills } : {}),
      ...(useSkillCategories && validCategories.length > 0 ? { skillCategories: validCategories } : {}),
      ...(coursework.trim() ? { coursework: coursework.trim() } : {}),
      ...(societiesList.length > 0 ? { societies: societiesList } : {}),
    }
    onSubmit(templateId, additionalSections)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Template</Label>
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No templates available.{" "}
            <Link href="/templates" className="text-primary underline">Upload one first</Link>
          </p>
        ) : (
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-sm font-semibold">Header Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Full Name *</Label>
            <Input value={header.name} onChange={(e) => updateHeader("name", e.target.value)} placeholder="Jane Smith" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email *</Label>
            <Input value={header.email} onChange={(e) => updateHeader("email", e.target.value)} placeholder="jane@example.com" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Phone</Label>
            <Input value={header.phone ?? ""} onChange={(e) => updateHeader("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">LinkedIn URL</Label>
            <Input value={header.linkedin ?? ""} onChange={(e) => updateHeader("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">GitHub URL</Label>
            <Input value={header.github ?? ""} onChange={(e) => updateHeader("github", e.target.value)} placeholder="https://github.com/..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Portfolio URL</Label>
            <Input value={header.portfolio ?? ""} onChange={(e) => updateHeader("portfolio", e.target.value)} placeholder="https://..." />
          </div>
        </div>
      </div>

      <CompileSummaryAI
        jobDescriptionId={jdId}
        facetIds={facetIds}
        value={summary}
        onChange={setSummary}
      />

      {/* Skills section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Skills</Label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={useSkillCategories}
              onChange={(e) => setUseSkillCategories(e.target.checked)}
              className="h-3.5 w-3.5 rounded"
            />
            Use categories
          </label>
        </div>

        {useSkillCategories ? (
          <div className="space-y-3 p-3 border rounded-lg">
            {skillCategories.map((cat, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex gap-2 items-center">
                  <Input
                    value={cat.name}
                    onChange={(e) => updateCategory(i, "name", e.target.value)}
                    placeholder="Category name (e.g. Programming)"
                    className="flex-1 h-8 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeCategory(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Input
                  value={cat.items.join(", ")}
                  onChange={(e) => updateCategory(i, "items", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  placeholder="Python, C++, JavaScript (comma-separated)"
                  className="h-8 text-sm"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addCategory}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add category
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Input
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="Python, SQL, Docker (merged with block skills)"
            />
            <p className="text-xs text-muted-foreground">These are merged with skills from your selected blocks</p>
          </div>
        )}
      </div>

      {/* Coursework */}
      <div className="space-y-1.5">
        <Label>Coursework</Label>
        <textarea
          value={coursework}
          onChange={(e) => setCoursework(e.target.value)}
          placeholder="One course per line, e.g.&#10;Analysis of Algorithms&#10;Artificial Intelligence&#10;Operating Systems"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[60px] resize-y"
          rows={3}
        />
      </div>

      {/* Societies */}
      <div className="space-y-1.5">
        <Label>Societies / Memberships</Label>
        <textarea
          value={societies}
          onChange={(e) => setSocieties(e.target.value)}
          placeholder="One per line, e.g.&#10;Association for Computing Machinery&#10;University Honors College"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[60px] resize-y"
          rows={3}
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !templateId || !header.name || !header.email}
        className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        {loading ? "Compiling..." : "Compile Resume"}
      </button>
    </div>
  )
}
