import { notFound } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { BlockDetailClient } from "@/components/blocks/BlockDetailClient"
import type { ParsedFacet, BlockWithParsedFacets } from "@/types"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function BlockDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const block = await prisma.block.findUnique({
    where: { id },
    include: { facets: { orderBy: { createdAt: "asc" } } },
  })

  if (!block) notFound()

  const parsed: BlockWithParsedFacets = {
    ...block,
    facets: block.facets.map((f): ParsedFacet => ({
      ...f,
      bulletPoints: JSON.parse(f.bulletPoints) as string[],
      skills: JSON.parse(f.skills) as string[],
    })),
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/blocks"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Block Library
      </Link>
      <BlockDetailClient block={parsed} />
    </div>
  )
}
