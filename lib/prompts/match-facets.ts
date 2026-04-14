import type { JDAnalysis, FacetMatchResult } from "@/types"

export function getMatchFacetsPrompt(
  jdAnalysis: JDAnalysis,
  candidates: Array<{
    blockId: string
    facetId: string
    blockTitle: string
    blockOrganization: string
    facetIndustry: string
    facetRoleType: string
    skills: string[]
    bulletPoints: string[]
    totalScore: number
  }>
): string {
  const candidateList = candidates
    .map(
      (c, i) => `[${i + 1}] ${c.blockTitle} at ${c.blockOrganization}
   Industry: ${c.facetIndustry} | Role: ${c.facetRoleType}
   Score: ${c.totalScore}/100
   Skills: ${c.skills.join(", ")}
   Bullets: ${c.bulletPoints.slice(0, 2).join(" | ")}`
    )
    .join("\n\n")

  return `You are a resume expert. A candidate is applying for a ${jdAnalysis.roleType} role in ${jdAnalysis.industry}.

Job requires: ${jdAnalysis.requiredSkills.join(", ")}
Key responsibilities: ${jdAnalysis.keyResponsibilities.slice(0, 3).join("; ")}

Here are the candidate's experience blocks (pre-scored by relevance):

${candidateList}

Tasks:
1. Re-rank these blocks in the optimal order for this specific job application
2. For cross-domain roles (e.g. software + education), recommend which blocks best bridge both domains
3. For each block, provide a brief 1-sentence reasoning for its inclusion/placement

Return ONLY JSON:
{
  "rankedOrder": number[],
  "reasoning": Record<number, string>
}

Where rankedOrder is an array of the candidate numbers [1-${candidates.length}] in recommended order.`
}
