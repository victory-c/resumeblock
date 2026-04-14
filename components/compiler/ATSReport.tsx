"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface ATSReportProps {
  coverage: number
  found: string[]
  missing: string[]
  warnings: string[]
}

export function ATSReport({ coverage, found, missing, warnings }: ATSReportProps) {
  const [open, setOpen] = useState(false)

  const color = coverage >= 70 ? "text-green-600" : coverage >= 40 ? "text-yellow-600" : "text-red-600"
  const bg = coverage >= 70 ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" : coverage >= 40 ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800" : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"

  return (
    <div className={`border rounded-lg overflow-hidden ${bg}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">ATS Keyword Coverage</span>
          <span className={`text-2xl font-bold ${color}`}>{coverage}%</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t">
          {warnings.length > 0 && (
            <div className="mt-4 space-y-1">
              <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Warnings</p>
              {warnings.map((w) => (
                <p key={w} className="text-xs text-yellow-600 dark:text-yellow-400">⚠ {w}</p>
              ))}
            </div>
          )}

          {found.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-green-700 dark:text-green-300">Found ({found.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {found.map((k) => (
                  <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {missing.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-red-700 dark:text-red-300">Missing ({missing.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((k) => (
                  <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
