import { notFound } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { CompileClient } from "@/components/compiler/CompileClient"
import { ArrowLeft } from "lucide-react"

interface SearchParams {
  jdId?: string
  facets?: string
  blocks?: string
}

export default async function CompileNewPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const facetIds = searchParams.facets
    ? searchParams.facets.split(",").filter(Boolean)
    : []

  if (facetIds.length === 0) {
    return (
      <div className="p-8">
        <p className="text-destructive">No facets selected. Please go back and select blocks for your resume.</p>
        <Link href="/applications" className="text-primary underline text-sm mt-2 block">
          ← Back to Applications
        </Link>
      </div>
    )
  }

  const templates = await prisma.template.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  })

  let jdInfo: { companyName: string; roleTitle: string } | null = null
  if (searchParams.jdId) {
    const jd = await prisma.jobDescription.findUnique({
      where: { id: searchParams.jdId },
      select: { companyName: true, roleTitle: true },
    })
    jdInfo = jd
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href={searchParams.jdId ? `/applications/${searchParams.jdId}` : "/applications"}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h1 className="text-2xl font-bold">Compile Resume</h1>
        {jdInfo && (
          <p className="text-muted-foreground text-sm mt-1">
            {jdInfo.roleTitle} at {jdInfo.companyName} · {facetIds.length} blocks selected
          </p>
        )}
        {!jdInfo && (
          <p className="text-muted-foreground text-sm mt-1">
            {facetIds.length} blocks selected
          </p>
        )}
      </div>

      <CompileClient
        templates={templates}
        facetIds={facetIds}
        jdId={searchParams.jdId}
      />
    </div>
  )
}
