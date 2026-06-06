import { notFound } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { detectPlaceholders } from "@/lib/latex"
import { TemplateSourceViewer } from "@/components/compiler/TemplateSourceViewer"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const template = await prisma.template.findUnique({ where: { id } })
  if (!template) notFound()

  const placeholders = detectPlaceholders(template.latexSource)

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href="/templates"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Templates
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{template.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Created {new Date(template.createdAt).toLocaleDateString()}
        </p>
      </div>

      <TemplateSourceViewer
        latexSource={template.latexSource}
        placeholders={placeholders}
      />
    </div>
  )
}
