"use client"

import Link from "next/link"
import { Trash2 } from "lucide-react"
import { useState } from "react"

interface Template {
  id: string
  name: string
  placeholderFormat: string
  createdAt: string
}

interface TemplateCardProps {
  template: Template
  onDelete: (id: string) => void
}

export function TemplateCard({ template, onDelete }: TemplateCardProps) {
  const [confirming, setConfirming] = useState(false)
  let placeholders: string[] = []
  try { placeholders = JSON.parse(template.placeholderFormat) as string[] } catch { /* empty */ }

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    await fetch(`/api/templates/${template.id}`, { method: "DELETE" })
    onDelete(template.id)
  }

  return (
    <div className="border rounded-lg p-4 bg-card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm">{template.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(template.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            confirming
              ? "bg-destructive text-destructive-foreground"
              : "text-muted-foreground hover:text-destructive"
          }`}
        >
          {confirming ? "Confirm" : <Trash2 className="h-4 w-4" />}
        </button>
      </div>

      {placeholders.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {placeholders.map((p) => (
            <span key={p} className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
              %%{p}%%
            </span>
          ))}
        </div>
      )}

      <Link
        href={`/templates/${template.id}`}
        className="text-xs text-primary hover:underline mt-auto"
      >
        View source →
      </Link>
    </div>
  )
}
