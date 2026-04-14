import { BlockCard } from "./BlockCard"

type BlockWithCount = {
  id: string
  title: string
  organization: string
  startDate: Date
  endDate: Date | null
  type: string
  _count: { facets: number }
}

interface Props {
  blocks: BlockWithCount[]
  onDeleted: (id: string) => void
}

export function BlockGrid({ blocks, onDeleted }: Props) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">No blocks found.</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {blocks.map((b) => (
        <BlockCard key={b.id} block={b} onDeleted={() => onDeleted(b.id)} />
      ))}
    </div>
  )
}
