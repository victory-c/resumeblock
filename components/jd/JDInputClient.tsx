"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { JDTextInput } from "./JDTextInput"
import { Loader2 } from "lucide-react"

const LOADING_MESSAGES = [
  "Parsing job description...",
  "Matching against your experience library...",
  "Preparing recommendations...",
]

export function JDInputClient() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState("")
  const [roleTitle, setRoleTitle] = useState("")
  const [jdText, setJdText] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(0)

  useEffect(() => {
    if (!analyzing) return
    const id = setInterval(() => {
      setLoadingMsg((prev) => Math.min(prev + 1, LOADING_MESSAGES.length - 1))
    }, 2500)
    return () => clearInterval(id)
  }, [analyzing])

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jdText.trim()) {
      toast.error("Please paste a job description first")
      return
    }
    setAnalyzing(true)
    setLoadingMsg(0)
    try {
      const res = await fetch("/api/jd/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: jdText, companyName, roleTitle }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === "llm_unavailable") {
          toast.error("LLM is offline. Start Ollama and try again.")
        } else {
          toast.error(data.error || "Analysis failed")
        }
        return
      }
      router.push(`/applications/${data.jobDescriptionId}`)
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <form onSubmit={handleAnalyze} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Company Name</label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Acme Corp (auto-detected if blank)"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Role Title</label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="e.g. Software Engineer (auto-detected if blank)"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Job Description *</label>
        <JDTextInput value={jdText} onChange={setJdText} />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={analyzing || !jdText.trim()}>
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {LOADING_MESSAGES[loadingMsg]}
            </>
          ) : (
            "Analyze Job Description"
          )}
        </Button>
        {!analyzing && (
          <p className="text-xs text-muted-foreground">
            Takes 15–30 seconds with a local LLM
          </p>
        )}
      </div>
    </form>
  )
}
