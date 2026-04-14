import Link from "next/link"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Briefcase, Upload, FileText, ArrowRight } from "lucide-react"

async function getStats() {
  const [blockCount, jdCount, resumeCount] = await Promise.all([
    prisma.block.count(),
    prisma.jobDescription.count(),
    prisma.compiledResume.count(),
  ])
  const recentJDs = await prisma.jobDescription.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    select: { id: true, companyName: true, roleTitle: true, createdAt: true },
  })
  const recentResumes = await prisma.compiledResume.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      jobDescription: { select: { companyName: true, roleTitle: true } },
    },
  })
  return { blockCount, jdCount, resumeCount, recentJDs, recentResumes }
}

export default async function DashboardPage() {
  const { blockCount, jdCount, resumeCount, recentJDs, recentResumes } =
    await getStats()

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Experience Blocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{blockCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Job Descriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{jdCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compiled Resumes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{resumeCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-medium mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link href="/import">
          <Button variant="outline" className="w-full justify-start gap-2 h-12">
            <Upload className="h-4 w-4" />
            Import Resume
          </Button>
        </Link>
        <Link href="/blocks">
          <Button variant="outline" className="w-full justify-start gap-2 h-12">
            <BookOpen className="h-4 w-4" />
            Manage Blocks
          </Button>
        </Link>
        <Link href="/applications/new">
          <Button variant="outline" className="w-full justify-start gap-2 h-12">
            <Briefcase className="h-4 w-4" />
            New Application
          </Button>
        </Link>
        <Link href="/templates">
          <Button variant="outline" className="w-full justify-start gap-2 h-12">
            <FileText className="h-4 w-4" />
            Manage Templates
          </Button>
        </Link>
      </div>

      {/* Recent Activity */}
      {(recentJDs.length > 0 || recentResumes.length > 0) && (
        <div className="grid grid-cols-2 gap-6">
          {recentJDs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium">Recent Applications</h2>
                <Link
                  href="/applications"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {recentJDs.map((jd) => (
                  <Link key={jd.id} href={`/applications/${jd.id}`}>
                    <div className="rounded-md border p-3 text-sm hover:bg-accent transition-colors">
                      <p className="font-medium">{jd.roleTitle}</p>
                      <p className="text-muted-foreground text-xs">{jd.companyName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {recentResumes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium">Recent Resumes</h2>
              </div>
              <div className="space-y-2">
                {recentResumes.map((r) => (
                  <div key={r.id} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">
                      {r.jobDescription.roleTitle} @ {r.jobDescription.companyName}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{r.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {blockCount === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center mt-4">
          <p className="text-muted-foreground mb-4">
            No blocks yet. Start by importing your resume or creating a block manually.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/import">
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Import Resume
              </Button>
            </Link>
            <Link href="/blocks">
              <Button variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Add Block Manually
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
