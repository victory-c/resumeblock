"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, AlertTriangle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { ParsedResumeEntry } from "@/types"

type EntryWithLabels = ParsedResumeEntry & {
  targetIndustry: string
  targetRoleType: string
}

type State =
  | { type: "idle" }
  | { type: "uploading" }
  | { type: "done"; entries: EntryWithLabels[]; languages: string[]; rawText: string; llmOffline?: boolean }
  | { type: "error"; message: string }

interface Props {
  onComplete: (entries: EntryWithLabels[], languages: string[], rawText: string) => void
}

export function UploadDropzone({ onComplete }: Props) {
  const [state, setState] = useState<State>({ type: "idle" })

  const processFile = useCallback(async (file: File) => {
    setState({ type: "uploading" })
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/parse-resume", { method: "POST", body: fd })
      const data = await res.json()

      if (data.status === "success") {
        const entries: EntryWithLabels[] = (data.entries || []).map((e: ParsedResumeEntry) => ({
          ...e,
          targetIndustry: "",
          targetRoleType: "",
        }))
        const languages: string[] = data.languages || []
        setState({ type: "done", entries, languages, rawText: data.rawText })
        onComplete(entries, languages, data.rawText)
      } else if (data.status === "llm_unavailable") {
        setState({ type: "done", entries: [], languages: [], rawText: data.rawText, llmOffline: true })
        onComplete([], [], data.rawText)
      } else if (data.status === "extraction_failed") {
        setState({ type: "done", entries: [], languages: [], rawText: data.rawText })
        onComplete([], [], data.rawText)
      } else {
        setState({ type: "error", message: data.message || "Unexpected error" })
      }
    } catch {
      setState({ type: "error", message: "Network error — please try again." })
    }
  }, [onComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    onDropAccepted: ([file]) => processFile(file),
    onDropRejected: () => setState({ type: "error", message: "Only PDF files are accepted." }),
  })

  if (state.type === "uploading") {
    return (
      <div className="space-y-2">
        <Skeleton className="h-32 w-full rounded-lg" />
        <p className="text-center text-sm text-muted-foreground">Parsing your resume with AI...</p>
      </div>
    )
  }

  if (state.type === "done" && state.llmOffline) {
    return (
      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-yellow-800">LLM is offline</p>
          <p className="text-yellow-700 mt-1">
            Entries are blank — fill them in manually, or start Ollama and re-upload.
          </p>
        </div>
      </div>
    )
  }

  if (state.type === "error") {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 space-y-2">
        <p className="text-sm text-destructive">{state.message}</p>
        <button
          type="button"
          onClick={() => setState({ type: "idle" })}
          className="text-sm underline text-muted-foreground hover:text-foreground"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center cursor-pointer transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-foreground/30 hover:bg-muted/30"
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">
        {isDragActive ? "Drop your PDF here" : "Drop your PDF resume here or click to browse"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">PDF files only</p>
    </div>
  )
}
