import prisma from "@/lib/prisma"
import { TemplateLibraryClient } from "@/components/compiler/TemplateLibraryClient"

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, placeholderFormat: true, createdAt: true },
  })

  const serialized = templates.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
  }))

  return (
    <div className="p-8">
      <TemplateLibraryClient initialTemplates={serialized} />
    </div>
  )
}
