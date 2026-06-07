import Link from "next/link"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Plus, Briefcase } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ApplicationsPage() {
  const jds = await prisma.jobDescription.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, companyName: true, roleTitle: true, createdAt: true, _count: { select: { compiledResumes: true } } },
  })

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">Job descriptions you&apos;ve analyzed</p>
        </div>
        <Link href="/applications/new">
          <Button>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Application
          </Button>
        </Link>
      </div>

      {jds.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Briefcase className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No applications yet. Paste a job description to get started.</p>
          <Link href="/applications/new">
            <Button>Analyze Your First JD</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {jds.map((jd) => (
            <Link key={jd.id} href={`/applications/${jd.id}`}>
              <div className="rounded-lg border p-4 hover:bg-accent transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{jd.roleTitle}</p>
                    <p className="text-sm text-muted-foreground">{jd.companyName}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{new Date(jd.createdAt).toLocaleDateString()}</p>
                    <p>{jd._count.compiledResumes} resume{jd._count.compiledResumes !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
