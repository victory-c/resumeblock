"use client"

import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"

interface Props {
  skills: string[]
  onChange: (skills: string[]) => void
}

export function SkillsInput({ skills, onChange }: Props) {
  const [input, setInput] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [allSkills, setAllSkills] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((d) => setAllSkills(d.skills || []))
      .catch(() => {})
  }, [])

  const addSkill = (raw: string) => {
    const val = raw.trim().toLowerCase()
    if (val && !skills.includes(val)) {
      onChange([...skills, val])
    }
    setInput("")
    setShowDropdown(false)
  }

  const removeSkill = (s: string) => onChange(skills.filter((x) => x !== s))

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (input.trim()) addSkill(input)
    } else if (e.key === "Backspace" && !input && skills.length > 0) {
      onChange(skills.slice(0, -1))
    }
  }

  const handleInputChange = (val: string) => {
    setInput(val)
    if (val.trim()) {
      const filtered = allSkills.filter(
        (s) => s.includes(val.toLowerCase()) && !skills.includes(s)
      ).slice(0, 8)
      setSuggestions(filtered)
      setShowDropdown(filtered.length > 0)
    } else {
      setShowDropdown(false)
    }
  }

  return (
    <div className="relative">
      <div
        className="flex flex-wrap gap-1.5 min-h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus-within:ring-1 focus-within:ring-ring cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {skills.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs"
          >
            {s}
            <button type="button" onClick={() => removeSkill(s)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder={skills.length === 0 ? "Type a skill and press Enter" : ""}
          className="flex-1 min-w-24 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
        />
      </div>
      {showDropdown && (
        <div className="absolute top-full z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addSkill(s) }}
              className="flex w-full items-center px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
