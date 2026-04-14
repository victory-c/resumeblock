export type OllamaStatus = "ready" | "loading" | "offline"

const BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434"
const MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b"

export async function checkOllamaStatus(): Promise<OllamaStatus> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return "offline"
    const data = await res.json()
    const models: string[] = (data.models || []).map((m: { name: string }) => m.name)
    if (models.length === 0) return "loading"
    return "ready"
  } catch {
    return "offline"
  }
}

export async function listModels(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.models || []).map((m: { name: string }) => m.name)
  } catch {
    return []
  }
}

export async function generate(prompt: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, prompt, stream: false }),
  })
  if (!res.ok) throw new Error(`Ollama generate failed: ${res.status}`)
  const data = await res.json()
  return data.response as string
}

export async function generateStream(
  prompt: string,
  onChunk: (text: string) => void
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, prompt, stream: true }),
  })
  if (!res.ok) throw new Error(`Ollama stream failed: ${res.status}`)
  const reader = res.body?.getReader()
  if (!reader) return
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const lines = decoder.decode(value).split("\n").filter(Boolean)
    for (const line of lines) {
      try {
        const json = JSON.parse(line)
        if (json.response) onChunk(json.response)
      } catch {
        // skip malformed line
      }
    }
  }
}

export function parseJSONResponse<T>(raw: string): T | null {
  // Strip markdown code fences
  let text = raw
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/m, "")
    .trim()

  // Direct parse first
  try { return JSON.parse(text) as T } catch { /* continue */ }

  // Find the outermost [ ] or { } by bracket matching
  for (const [open, close] of [["[", "]"], ["{", "}"]]) {
    const start = text.indexOf(open)
    if (start === -1) continue
    let depth = 0
    let end = -1
    for (let i = start; i < text.length; i++) {
      if (text[i] === open) depth++
      else if (text[i] === close) {
        depth--
        if (depth === 0) { end = i; break }
      }
    }
    if (end !== -1) {
      try { return JSON.parse(text.slice(start, end + 1)) as T } catch { /* continue */ }
    }
  }
  return null
}

export const ollamaConfig = { baseUrl: BASE_URL, model: MODEL }
