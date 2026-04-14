"use client"

import { LatexErrorDisplay } from "./LatexErrorDisplay"
import { DownloadButtons } from "./DownloadButtons"

interface PDFPreviewProps {
  pdfId: string
  compiledLatex: string
  errorLog?: string
  problemLine?: string
}

export function PDFPreview({ pdfId, compiledLatex, errorLog, problemLine }: PDFPreviewProps) {
  if (errorLog) {
    return (
      <div className="space-y-4">
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
          <h3 className="font-semibold text-destructive mb-3">Compilation Failed</h3>
          <LatexErrorDisplay errorLog={errorLog} problemLine={problemLine} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden bg-muted/30">
        <iframe
          src={`/api/compile/pdf/${pdfId}`}
          className="w-full h-[700px]"
          title="Resume PDF Preview"
        />
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">
          PDF not displaying?{" "}
          <a href={`/api/compile/pdf/${pdfId}`} target="_blank" rel="noopener noreferrer" className="underline">
            Open in new tab
          </a>
        </p>
      </div>
      <DownloadButtons pdfId={pdfId} compiledLatex={compiledLatex} />
    </div>
  )
}
