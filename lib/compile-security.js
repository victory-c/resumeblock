export const MAX_COMPILE_BODY_BYTES = 1_000_000
export const MAX_CONCURRENT_COMPILES = 2
export const MAX_TEMPLATE_BYTES = 512_000
export const MAX_RESUME_PDF_BYTES = 10_000_000

let activeCompiles = 0

function byteLength(text) {
  return new TextEncoder().encode(text).byteLength
}

function extractHostname(host) {
  if (!host) return ""
  const trimmed = host.trim().toLowerCase()
  if (trimmed.startsWith("[")) {
    const end = trimmed.indexOf("]")
    return end === -1 ? trimmed : trimmed.slice(1, end)
  }
  return trimmed.split(":")[0]
}

export function isLocalCompileHost(host) {
  const hostname = extractHostname(host)
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
}

export function enforceLocalRequest(req) {
  if (isLocalCompileHost(req.headers.get("host"))) return null

  return Response.json(
    { error: "This endpoint is only available from localhost" },
    { status: 403 }
  )
}

export function hasUnsafeLatexPrimitives(source) {
  // Compilation runs with shell escape disabled, but these primitives can still
  // read/write arbitrary local files in a permissive TeX installation.
  return /\\(?:input|include|usepackage|documentclass)\s*(?:\[[^\]]*\])?\s*\{\s*(?:\/|\.\.)/i.test(source)
    || /\\(?:openin|openout|read|write|immediate|input\||@@input)/i.test(source)
}

export function enforceLocalCompileRequest(req) {
  return enforceLocalRequest(req)
}

export async function readLimitedJson(req) {
  const contentLength = req.headers.get("content-length")
  if (contentLength && Number(contentLength) > MAX_COMPILE_BODY_BYTES) {
    return {
      response: Response.json(
        { error: "Request body too large" },
        { status: 413 }
      ),
    }
  }

  const rawBody = await req.text()
  if (byteLength(rawBody) > MAX_COMPILE_BODY_BYTES) {
    return {
      response: Response.json(
        { error: "Request body too large" },
        { status: 413 }
      ),
    }
  }

  try {
    return { body: JSON.parse(rawBody) }
  } catch {
    return {
      response: Response.json({ error: "Invalid JSON" }, { status: 400 }),
    }
  }
}

export function tryAcquireCompileSlot() {
  if (activeCompiles >= MAX_CONCURRENT_COMPILES) {
    return null
  }

  activeCompiles += 1
  let released = false

  return () => {
    if (released) return
    released = true
    activeCompiles = Math.max(0, activeCompiles - 1)
  }
}
