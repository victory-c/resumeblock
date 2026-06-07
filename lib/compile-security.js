export const MAX_COMPILE_BODY_BYTES = 1_000_000
export const MAX_CONCURRENT_COMPILES = 2

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

export function enforceLocalCompileRequest(req) {
  if (isLocalCompileHost(req.headers.get("host"))) return null

  return Response.json(
    { error: "Compile endpoints are only available from localhost" },
    { status: 403 }
  )
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
