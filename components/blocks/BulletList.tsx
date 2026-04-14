"use client"

import { ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react"

interface Props {
  bullets: string[]
  onChange: (bullets: string[]) => void
}

export function BulletList({ bullets, onChange }: Props) {
  const update = (i: number, val: string) => {
    const next = [...bullets]
    next[i] = val
    onChange(next)
  }

  const remove = (i: number) => onChange(bullets.filter((_, idx) => idx !== i))

  const move = (i: number, dir: -1 | 1) => {
    const next = [...bullets]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-1.5">
      {bullets.map((bullet, i) => (
        <div key={i} className="flex gap-1">
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="flex h-4 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === bullets.length - 1}
              className="flex h-4 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ArrowDown className="h-3 w-3" />
            </button>
          </div>
          <input
            value={bullet}
            onChange={(e) => update(i, e.target.value)}
            className="flex h-8 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder={`Bullet ${i + 1}`}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-input text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...bullets, ""])}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        <Plus className="h-3.5 w-3.5" /> Add bullet
      </button>
    </div>
  )
}
