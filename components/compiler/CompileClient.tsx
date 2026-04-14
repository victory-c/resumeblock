"use client"

import { useState } from "react"
import { CompileConfigForm } from "./CompileConfigForm"
import { PDFPreview } from "./PDFPreview"
import { ATSReport } from "./ATSReport"
import type { AdditionalSections } from "@/types"

interface Template {
  id: string
  name: string
}

interface CompileClientProps {
  templates: Template[]
  facetIds: string[]
  jdId?: string
}

type Step = "configure" | "preview"

interface CompileResult {
  pdfId?: string
  compiledLatex: string
  errorLog?: string
  problemLine?: string
  atsReport?: {
    coverage: number
    found: string[]
    missing: string[]
    warnings: string[]
  }
}

export function CompileClient({ templates, facetIds, jdId }: CompileClientProps) {
  const [step, setStep] = useState<Step>("configure")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CompileResult | null>(null)
  const [error, setError] = useState("")

  async function handleCompile(templateId: string, additionalSections: AdditionalSections) {
    setLoading(true)
    setError("")

    const res = await fetch("/api/compile/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, facetIds, additionalSections, jobDescriptionId: jdId }),
    })

    const data = await res.json()
    setLoading(false)

    if (data.status === "error") {
      setResult({ compiledLatex: data.compiledLatex, errorLog: data.errorLog, problemLine: data.problemLine })
      setStep("preview")
      return
    }

    if (data.status === "success") {
      let atsReport
      if (jdId) {
        try {
          const atsRes = await fetch("/api/compile/ats-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ compiledLatex: data.compiledLatex, jobDescriptionId: jdId }),
          })
          if (atsRes.ok) atsReport = await atsRes.json()
        } catch { /* non-critical */ }
      }

      // Save to DB
      try {
        await fetch("/api/compile/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobDescriptionId: jdId ?? "",
            templateId,
            selectedFacetIds: facetIds,
            additionalSections,
            compiledLatex: data.compiledLatex,
            pdfPath: `data/output/${data.pdfId}.pdf`,
            status: "compiled",
          }),
        })
      } catch { /* non-critical */ }

      setResult({ pdfId: data.pdfId, compiledLatex: data.compiledLatex, atsReport })
      setStep("preview")
    } else {
      setError("Unexpected response from server")
    }
  }

  function handleBack() {
    setStep("configure")
    setResult(null)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        {(["configure", "preview"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-border" />}
            <div className={`flex items-center gap-1.5 text-sm ${step === s ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {i + 1}
              </div>
              {s === "configure" ? "Configure" : "Preview"}
            </div>
          </div>
        ))}
      </div>

      {step === "configure" && (
        <CompileConfigForm
          templates={templates}
          facetIds={facetIds}
          jdId={jdId}
          onSubmit={handleCompile}
          loading={loading}
        />
      )}

      {step === "preview" && result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {result.errorLog ? "Compilation Error" : "Resume Preview"}
            </h2>
            <button
              onClick={handleBack}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Configure
            </button>
          </div>

          {result.pdfId && !result.errorLog && result.atsReport && (
            <ATSReport {...result.atsReport} />
          )}

          <PDFPreview
            pdfId={result.pdfId ?? ""}
            compiledLatex={result.compiledLatex}
            errorLog={result.errorLog}
            problemLine={result.problemLine}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  )
}
