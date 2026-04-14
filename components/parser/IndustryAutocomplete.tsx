"use client"

export const COMMON_INDUSTRIES = [
  "Software Engineering",
  "Data Science",
  "Machine Learning / AI",
  "DevOps / Platform Engineering",
  "Cybersecurity",
  "Education",
  "EdTech",
  "Finance / FinTech",
  "Healthcare / HealthTech",
  "Marketing",
  "Product Management",
  "Research",
  "Consulting",
  "Sales / Business Development",
  "Design / UX",
  "Operations",
  "Legal / Compliance",
  "Nonprofit / Social Impact",
  "Media / Entertainment",
  "Other",
]

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  id?: string
}

export function IndustryAutocomplete({ value, onChange, placeholder, id }: Props) {
  return (
    <>
      <input
        id={id}
        list="industry-datalist"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "e.g. Software Engineering"}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <datalist id="industry-datalist">
        {COMMON_INDUSTRIES.map((ind) => (
          <option key={ind} value={ind} />
        ))}
      </datalist>
    </>
  )
}
