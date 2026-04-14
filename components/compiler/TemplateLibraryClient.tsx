"use client"

import { useState } from "react"
import { TemplateCard } from "./TemplateCard"
import { TemplateUploadDialog } from "./TemplateUploadDialog"

interface Template {
  id: string
  name: string
  placeholderFormat: string
  createdAt: string
}

interface TemplateLibraryClientProps {
  initialTemplates: Template[]
}

export function TemplateLibraryClient({ initialTemplates }: TemplateLibraryClientProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)

  function handleDelete(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  function handleUploaded(template: Template) {
    setTemplates((prev) => [template, ...prev])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your LaTeX resume templates
          </p>
        </div>
        <TemplateUploadDialog onUploaded={handleUploaded} />
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No templates yet</p>
          <p className="text-sm mt-1">Upload a .tex file to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
