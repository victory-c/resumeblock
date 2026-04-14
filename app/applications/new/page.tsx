import { JDInputClient } from "@/components/jd/JDInputClient"

export default function NewApplicationPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-2">New Application</h1>
      <p className="text-muted-foreground mb-6">
        Paste a job description to analyze it and get personalized block recommendations.
      </p>
      <JDInputClient />
    </div>
  )
}
