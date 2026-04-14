"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DownloadButtonsProps {
  pdfId: string
  compiledLatex: string
}

export function DownloadButtons({ pdfId, compiledLatex }: DownloadButtonsProps) {
  function downloadLatex() {
    const blob = new Blob([compiledLatex], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "resume.tex"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-3">
      <a
        href={`/api/compile/pdf/${pdfId}`}
        download="resume.pdf"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Download className="h-4 w-4" /> Download PDF
      </a>
      <Button variant="outline" onClick={downloadLatex} className="gap-2">
        <Download className="h-4 w-4" /> Download .tex
      </Button>
    </div>
  )
}
