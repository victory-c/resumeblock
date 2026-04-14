export function getAnalyzeJDPrompt(jdText: string): string {
  return `Analyze the job description below and extract structured information.

Return ONLY JSON with no prose, no markdown, no explanation:
{
  "requiredSkills": string[],
  "preferredSkills": string[],
  "keyResponsibilities": string[],
  "experienceLevel": "entry" | "mid" | "senior" | "unknown",
  "industry": string,
  "roleType": string,
  "atsKeywords": string[],
  "culturalSignals": string[],
  "confidence": "high" | "medium" | "low"
}

Definitions:
- "requiredSkills": hard skills explicitly required (tools, languages, frameworks, certifications)
- "preferredSkills": nice-to-have skills mentioned but not required
- "keyResponsibilities": 3-6 bullet summaries of main job duties
- "experienceLevel": infer from years required or level language (junior/senior/lead)
- "industry": specific domain (e.g. "EdTech", "FinTech", "Healthcare SaaS", "E-commerce")
- "roleType": exact job function (e.g. "Full-Stack Engineer", "Data Analyst", "Product Manager")
- "atsKeywords": exact skill/tool/technology/methodology phrases to include verbatim in a resume for ATS matching.
    INCLUDE: programming languages, frameworks, libraries, tools, platforms, certifications, methodologies, domain-specific terms (e.g. "React", "CI/CD", "HIPAA compliance", "Agile", "REST API", "machine learning")
    EXCLUDE: city/state/country names, company names, years of experience ("5+ years"), generic soft skills ("communication", "teamwork", "detail-oriented"), job titles, salary info, benefits, and words that appear as company boilerplate
    Maximum 15 keywords. Prefer specific technical or domain terms over generic words.
- "culturalSignals": soft skill or culture indicators (e.g. "collaborative", "fast-paced", "mentorship")
- "confidence": "low" if the JD is vague or lacks specifics

Job description:
---
${jdText}
---`
}
