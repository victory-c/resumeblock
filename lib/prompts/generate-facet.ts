export function getGenerateFacetPrompt(
  originalBullets: string[],
  targetIndustry: string,
  targetRoleType: string
): string {
  const bulletList = originalBullets.map((b, i) => `${i + 1}. ${b}`).join("\n")
  return `You are a professional resume writer. Rewrite the bullet points below for a candidate applying to a ${targetIndustry} ${targetRoleType} role.

Rules:
- Keep every claim truthful — do not invent experiences or embellish facts
- Emphasize skills, tools, and achievements most relevant to ${targetIndustry} and ${targetRoleType}
- Improve action verbs and add quantification where the original implies it
- Each bullet should start with a strong action verb
- Also suggest 5-8 relevant skills/keywords for this facet

Return ONLY JSON with no prose:
{
  "bulletPoints": string[],
  "skills": string[]
}

Original bullet points:
${bulletList}

Target industry: ${targetIndustry}
Target role type: ${targetRoleType}`
}
