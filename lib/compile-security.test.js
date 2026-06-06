import test from "node:test"
import assert from "node:assert/strict"
import {
  enforceLocalCompileRequest,
  isLocalCompileHost,
  MAX_COMPILE_BODY_BYTES,
  readLimitedJson,
} from "./compile-security.js"

test("allows only localhost compile hosts", () => {
  assert.equal(isLocalCompileHost("localhost:3000"), true)
  assert.equal(isLocalCompileHost("127.0.0.1:3000"), true)
  assert.equal(isLocalCompileHost("[::1]:3000"), true)
  assert.equal(isLocalCompileHost("resume.example.com"), false)

  const blocked = enforceLocalCompileRequest(
    new Request("http://resume.example.com/api/compile/preview", {
      headers: { host: "resume.example.com" },
    })
  )

  assert.equal(blocked.status, 403)
})

test("rejects oversized bodies before JSON parsing", async () => {
  const parsed = await readLimitedJson(
    new Request("http://localhost/api/compile/preview", {
      method: "POST",
      headers: { host: "localhost" },
      body: "x".repeat(MAX_COMPILE_BODY_BYTES + 1),
    })
  )

  assert.equal(parsed.response.status, 413)
})

test("parses bounded JSON bodies", async () => {
  const parsed = await readLimitedJson(
    new Request("http://localhost/api/compile/preview", {
      method: "POST",
      headers: { host: "localhost" },
      body: JSON.stringify({ ok: true }),
    })
  )

  assert.deepEqual(parsed.body, { ok: true })
})
