import prisma from "@/lib/prisma"
import { BlockLibraryClient } from "@/components/blocks/BlockLibraryClient"

export default async function BlocksPage() {
  const blocks = await prisma.block.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { facets: true } } },
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Block Library</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your experience blocks — each block can have multiple facets for different target roles.
        </p>
      </div>
      <BlockLibraryClient initialBlocks={blocks} />
    </div>
  )
}
