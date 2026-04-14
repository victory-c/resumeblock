"use client"

interface LatexErrorDisplayProps {
  errorLog: string
  problemLine?: string
}

function getSuggestion(errorLog: string): string | null {
  if (/undefined control sequence/i.test(errorLog)) {
    return "Undefined control sequence: check for typos in LaTeX commands or missing packages"
  }
  if (/missing \$ inserted/i.test(errorLog)) {
    return "Missing $: a math symbol was used outside math mode — check escaping of special chars like #, $, %, &"
  }
  if (/file .* not found/i.test(errorLog)) {
    return "File not found: the template references an external file (image or package) that is not available"
  }
  if (/extra alignment tab/i.test(errorLog)) {
    return "Extra & in table: check your tabular environment for mismatched columns"
  }
  if (/runaway argument/i.test(errorLog)) {
    return "Runaway argument: likely an unclosed brace { } in your template"
  }
  return null
}

export function LatexErrorDisplay({ errorLog, problemLine }: LatexErrorDisplayProps) {
  const suggestion = getSuggestion(errorLog)

  return (
    <div className="space-y-3">
      {problemLine && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
          <p className="text-xs font-medium text-destructive mb-1">Error</p>
          <code className="text-xs font-mono text-destructive">{problemLine}</code>
        </div>
      )}

      {suggestion && (
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
          <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">Suggestion</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">{suggestion}</p>
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Full Compilation Log</p>
        <pre className="text-xs font-mono bg-muted rounded-md p-3 overflow-auto max-h-64 whitespace-pre-wrap border">
          {errorLog}
        </pre>
      </div>
    </div>
  )
}
