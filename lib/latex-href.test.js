import test from "node:test"
import assert from "node:assert/strict"
import {
  LatexHrefValidationError,
  validateAdditionalSectionsLatexHrefs,
  validateLatexHttpHref,
  validateLatexMailtoHref,
} from "./latex-href.js"

test("validates safe http, https, and mailto hrefs", () => {
  assert.equal(
    validateLatexHttpHref("https://github.com/victory-c", "header.github"),
    "https://github.com/victory-c"
  )
  assert.equal(
    validateLatexHttpHref("http://example.com/resume", "header.portfolio"),
    "http://example.com/resume"
  )
  assert.equal(
    validateLatexMailtoHref("victor@example.com", "header.email"),
    "mailto:victor@example.com"
  )
})

test("rejects LaTeX control characters before href interpolation", () => {
  assert.throws(
    () => validateLatexHttpHref("https://example.com/}{}\\input{/etc/passwd}", "header.portfolio"),
    LatexHrefValidationError
  )
})

test("returns field-level validation errors for unsafe header links", () => {
  assert.deepEqual(
    validateAdditionalSectionsLatexHrefs({
      header: {
        github: "https://github.com/victory-c",
        linkedin: "javascript:alert(1)",
        portfolio: "https://example.com/\nnext",
        email: "victor@example.com",
      },
    }),
    [
      {
        field: "additionalSections.header.linkedin",
        message: "URL must start with http:// or https://",
      },
      {
        field: "additionalSections.header.portfolio",
        message: "URL must not contain LaTeX control characters",
      },
    ]
  )
})
