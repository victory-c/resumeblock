"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UploadDropzone } from "./UploadDropzone"
import { EntryReviewList } from "./EntryReviewList"
import type { ParsedResumeEntry } from "@/types"
import { CheckCircle2 } from "lucide-react"

type EntryWithLabels = ParsedResumeEntry & {
  targetIndustry: string
  targetRoleType: string
}

type Step = "upload" | "review" | "saved"

export function ResumeImportFlow() {
  const [step, setStep] = useState<Step>("upload")
  const [entries, setEntries] = useState<EntryWithLabels[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [rawText, setRawText] = useState("")
  const [savedCount, setSavedCount] = useState(0)

  const handleUploadComplete = (parsedEntries: EntryWithLabels[], parsedLanguages: string[], text: string) => {
    setEntries(parsedEntries)
    setLanguages(parsedLanguages)
    setRawText(text)
    setStep("review")
  }

  const handleSaved = (blockIds: string[]) => {
    setSavedCount(blockIds.length)
    setStep("saved")
  }

  if (step === "upload") {
    return <UploadDropzone onComplete={handleUploadComplete} />
  }

  if (step === "review") {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setStep("upload")}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            ← Upload a different file
          </button>
        </div>
        <EntryReviewList
          initialEntries={entries}
          initialLanguages={languages}
          rawText={rawText}
          onSaved={handleSaved}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-12 text-center space-y-4">
      <CheckCircle2 className="h-12 w-12 text-green-500" />
      <h2 className="text-xl font-semibold">Blocks saved!</h2>
      <p className="text-muted-foreground">
        {savedCount} block{savedCount !== 1 ? "s" : ""} added to your library.
      </p>
      <div className="flex gap-3 pt-2">
        <Link href="/blocks">
          <Button>View Block Library</Button>
        </Link>
        <Button variant="outline" onClick={() => { setStep("upload"); setEntries([]); setLanguages([]); setRawText("") }}>
          Import Another Resume
        </Button>
      </div>
    </div>
  )
}
