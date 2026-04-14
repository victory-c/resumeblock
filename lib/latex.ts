/**
 * Escape LaTeX special characters.
 * Order matters: backslash must be first.
 */
export function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/%/g, "\\%")
    .replace(/&/g, "\\&")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
}

/**
 * Format an array of bullet point strings into a LaTeX itemize environment.
 */
export function formatBulletPoints(bullets: string[]): string {
  if (bullets.length === 0) return ""
  const items = bullets.map((b) => `  \\item ${escapeLatex(b)}`).join("\n")
  return `\\begin{itemize}\n${items}\n\\end{itemize}`
}

/**
 * Format bullet points using the Deedy tightemize environment.
 */
export function formatBulletPointsDeedy(bullets: string[]): string {
  if (bullets.length === 0) return ""
  const items = bullets.map((b) => `  \\item ${escapeLatex(b)}`).join("\n")
  return `\\begin{tightemize}\n${items}\n\\end{tightemize}`
}

/**
 * Format a date range for display in a resume.
 * Returns "Aug 2023 -- Present" or "Aug 2023 -- Dec 2024"
 */
export function formatDateRange(start: Date, end: Date | null): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]
  const startStr = `${months[start.getMonth()]} ${start.getFullYear()}`
  if (!end) return `${startStr} -- Present`
  const endStr = `${months[end.getMonth()]} ${end.getFullYear()}`
  return `${startStr} -- ${endStr}`
}

/**
 * Inject content into a %%PLACEHOLDER%% marker in a LaTeX template.
 */
export function injectPlaceholder(
  template: string,
  placeholder: string,
  content: string
): string {
  return template.replace(new RegExp(`%%${placeholder}%%`, "g"), content)
}

/**
 * Find all %%PLACEHOLDER%% markers in a LaTeX template.
 * Returns a list of placeholder names (without the %% delimiters).
 */
export function detectPlaceholders(template: string): string[] {
  const matches = Array.from(template.matchAll(/%%([A-Z0-9_:]+)%%/g))
  const found = new Set<string>(matches.map((m) => m[1]))
  return Array.from(found)
}
