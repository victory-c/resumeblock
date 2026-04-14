export function getParseResumePrompt(resumeText: string): string {
  return `Extract ALL entries from this resume into two outputs: a JSON array of entries, and a languages list.

OUTPUT FORMAT — return exactly this JSON object (no prose, no markdown):
{
  "entries": [ ...array of entry objects... ],
  "languages": [ ...array of strings like "Mandarin (Native)", "Spanish (Fluent)"... ]
}

Each entry object must have exactly these fields:
- "title": the job title, award name, role label, or degree — ONLY a short label, never a sentence
- "organization": company, school, org, or issuer name — ONLY a name, never a sentence
- "location": city and state/country if mentioned (e.g. "Berkeley, CA", "New York, NY"), or null if not found
- "startDate": "YYYY-MM-DD" or "unknown"
- "endDate": "YYYY-MM-DD" or null if current/present, or "unknown"
- "type": one of "work", "project", "volunteer", "education", "award", "society", "club", "publicService", "other"
  - "work": paid employment or internship
  - "project": personal, academic, or side project
  - "volunteer": unpaid community work
  - "education": degree, certificate, coursework
  - "award": honor, prize, scholarship, dean's list
  - "society": professional or honor society membership
  - "club": student club, team, or organization membership
  - "publicService": community service, civic engagement
  - "other": anything that does not fit above
- "bulletPoints": array of achievement/responsibility bullet strings
- "needsReview": true if uncertain about any field, false otherwise

CRITICAL RULES FOR title AND bulletPoints:
- "title" is ONLY a short role/award label (e.g. "Software Engineer", "Dean's List") — never a sentence
- "organization" is ONLY a name (e.g. "Google", "UC Berkeley") — never a description
- "bulletPoints" contains ONLY achievement/responsibility sentences — never the title or org
- If a line starts with an action verb (Developed, Led, Built, Created, Managed, Designed, Implemented, etc.), it belongs in bulletPoints, NOT in title
- If you are unsure whether something is a title or a bullet, set needsReview: true and put it in bulletPoints

OTHER RULES:
- Include EVERY experience, award, education, society, club, and public service entry — do not skip any
- "Present", "Now", or "Current" means endDate is null
- Year only (e.g. "2023") becomes "2023-01-01"
- Copy bullet points verbatim, do not paraphrase
- Do NOT merge multiple entries into one object
- If no languages are found, return "languages": []

RESUME:
---
${resumeText}
---

{`
}
