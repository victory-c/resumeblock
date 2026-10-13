import test from "node:test"
import assert from "node:assert/strict"
import * as proxyModule from "../proxy.js"

const { proxy } = proxyModule

function requestFor(host, path) {
  return new Request(`http://${host}${path}`, { headers: { host } })
}

const SERVER_RENDERED_PATHS = [
  "/",
  "/blocks",
  "/blocks/abc123",
  "/applications",
  "/applications/abc123",
  "/templates",
  "/templates/abc123",
  "/compile/new",
]

test("rejects server-rendered pages requested with a foreign Host", () => {
  for (const path of SERVER_RENDERED_PATHS) {
    const response = proxy(requestFor("x.rebind.attacker.tld:3000", path))
    assert.equal(response?.status, 403, `expected 403 for ${path}`)
  }
})

test("rejects API routes requested with a foreign Host", () => {
  const response = proxy(requestFor("x.rebind.attacker.tld:3000", "/api/blocks"))
  assert.equal(response?.status, 403)
})

test("passes through loopback hosts", () => {
  for (const host of ["localhost:3000", "127.0.0.1:3000", "[::1]:3000"]) {
    for (const path of [...SERVER_RENDERED_PATHS, "/api/blocks"]) {
      assert.equal(proxy(requestFor(host, path)), undefined, `${host}${path}`)
    }
  }
})

test("runs on every route (no matcher narrowing it to /api)", () => {
  assert.equal(proxyModule.config?.matcher, undefined)
})
