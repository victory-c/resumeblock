"use client"

import { Textarea } from "@/components/ui/textarea"

interface Props {
  value: string
  onChange: (v: string) => void
}

export function JDTextInput({ value, onChange }: Props) {
  const len = value.length
  return (
    <div className="space-y-1">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the full job description here..."
        className="min-h-48 resize-y font-mono text-sm"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{len.toLocaleString()} characters</span>
        {len > 4000 && (
          <span className="text-yellow-600">
            Text will be truncated to 4,000 characters for analysis (requirements section is usually at the top)
          </span>
        )}
      </div>
    </div>
  )
}
