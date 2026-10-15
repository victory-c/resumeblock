import { enforceLocalRequest } from "./lib/compile-security.js"

// Loopback-only Host gate for every route, not just /api/*.
//
// The App Router pages (/blocks, /blocks/[id], /applications/[id],
// /templates/[id], ...) read Prisma directly and serialize the rows into the
// HTML/RSC payload. Binding to 127.0.0.1 does not stop DNS rebinding: a page on
// an attacker hostname that re-resolves to 127.0.0.1 can fetch those pages
// same-origin with a foreign Host header, even though the API routes reject
// that Host. Applying the same allowlist here closes that gap; the per-route
// enforceLocalRequest calls stay as defense in depth.
//
// No `config.matcher` on purpose: the gate must run on every request.
export function proxy(request) {
  const blocked = enforceLocalRequest(request)
  if (blocked) return blocked
}
