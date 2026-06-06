export class LatexHrefValidationError extends Error {
  constructor(field, message) {
    super(message)
    this.name = "LatexHrefValidationError"
    this.field = field
  }
}

const LATEX_HREF_FORBIDDEN_CHARS = /[{}\\\r\n]/

function assertHrefHasNoLatexControls(value, field) {
  if (LATEX_HREF_FORBIDDEN_CHARS.test(value)) {
    throw new LatexHrefValidationError(
      field,
      "URL must not contain LaTeX control characters"
    )
  }
}

export function validateLatexHttpHref(rawUrl, field = "url") {
  const value = rawUrl.trim()
  if (!value) {
    throw new LatexHrefValidationError(field, "URL is required")
  }
  assertHrefHasNoLatexControls(value, field)

  let parsed
  try {
    parsed = new URL(value)
  } catch {
    throw new LatexHrefValidationError(field, "URL must be absolute")
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new LatexHrefValidationError(field, "URL must start with http:// or https://")
  }

  return parsed.toString()
}

export function validateLatexMailtoHref(email, field = "email") {
  const value = email.trim()
  if (!value) {
    throw new LatexHrefValidationError(field, "Email is required")
  }
  assertHrefHasNoLatexControls(value, field)

  if (/\s/.test(value) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
    throw new LatexHrefValidationError(field, "Email must be a simple email address")
  }

  return `mailto:${value}`
}

export function validateAdditionalSectionsLatexHrefs(additionalSections) {
  const header = additionalSections?.header
  if (!header || typeof header !== "object") return []

  const errors = []
  const httpFields = [
    ["linkedin", "additionalSections.header.linkedin"],
    ["github", "additionalSections.header.github"],
    ["portfolio", "additionalSections.header.portfolio"],
  ]

  for (const [key, field] of httpFields) {
    const value = header[key]
    if (typeof value !== "string" || !value.trim()) continue
    try {
      validateLatexHttpHref(value, field)
    } catch (error) {
      if (error instanceof LatexHrefValidationError) {
        errors.push({ field: error.field, message: error.message })
      } else {
        errors.push({ field, message: "Invalid URL" })
      }
    }
  }

  const email = header.email
  if (typeof email === "string" && email.trim()) {
    try {
      validateLatexMailtoHref(email, "additionalSections.header.email")
    } catch (error) {
      if (error instanceof LatexHrefValidationError) {
        errors.push({ field: error.field, message: error.message })
      } else {
        errors.push({ field: "additionalSections.header.email", message: "Invalid email" })
      }
    }
  }

  return errors
}
