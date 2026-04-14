"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TemplateUploadDialogProps {
  onUploaded: (template: { id: string; name: string; placeholderFormat: string; createdAt: string }) => void
}

export function TemplateUploadDialog({ onUploaded }: TemplateUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0])
      if (!name) setName(accepted[0].name.replace(".tex", ""))
      setError("")
    }
  }, [name])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/x-tex": [".tex"],
      "text/plain": [".tex"],
      "text/x-tex": [".tex"],
      "application/octet-stream": [".tex"],
    },
    maxFiles: 1,
  })

  async function handleUpload() {
    if (!file || !name.trim()) { setError("Name and file are required"); return }
    setUploading(true)
    setError("")
    const fd = new FormData()
    fd.append("name", name.trim())
    fd.append("file", file)
    const res = await fetch("/api/templates", { method: "POST", body: fd })
    const data = await res.json()
    setUploading(false)
    if (!res.ok) { setError(data.error || "Upload failed"); return }
    onUploaded(data.template)
    if (data.warning) {
      // Show warning toast after closing dialog
      setTimeout(() => import("sonner").then(({ toast }) => toast.warning(data.warning, { duration: 8000 })), 100)
    }
    setOpen(false)
    setName("")
    setFile(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
        <Upload className="h-4 w-4" /> Upload Template
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload LaTeX Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Template Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Clean Professional" />
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-medium">{file.name}</span>
                <button onClick={(e) => { e.stopPropagation(); setFile(null) }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isDragActive ? "Drop .tex file here" : "Drag & drop a .tex file, or click to browse"}
              </p>
            )}
          </div>

          <div className="bg-muted rounded-md p-3 text-xs space-y-1">
            <p className="font-medium">Placeholder convention:</p>
            <p className="font-mono text-muted-foreground">%%HEADER%% %%EXPERIENCE%% %%EDUCATION%%</p>
            <p className="font-mono text-muted-foreground">%%PROJECTS%% %%SKILLS%% %%SUMMARY%%</p>
            <p className="font-mono text-muted-foreground">%%CUSTOM:SECTIONNAME%%</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleUpload} disabled={uploading || !file || !name.trim()} className="w-full">
            {uploading ? "Uploading..." : "Upload Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
