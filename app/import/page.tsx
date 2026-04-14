import { ResumeImportFlow } from "@/components/parser/ResumeImportFlow"

export default function ImportPage() {
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-2">Import Resume</h1>
      <p className="text-muted-foreground mb-6">
        Upload your existing resume PDF to automatically extract your experience blocks.
      </p>
      <ResumeImportFlow />
    </div>
  )
}
