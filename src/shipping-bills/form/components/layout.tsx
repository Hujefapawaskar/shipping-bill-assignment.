import { Button } from 'ui/basic/button'
import { Card, CardContent, CardHeader } from 'ui/basic/card'

export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-950">{title}</h2>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  )
}

interface AdvancedSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

/** Collapsed area for rarely used fields. Children stay mounted, so their values and validation are kept. */
export function AdvancedSection({ title, children, defaultOpen }: AdvancedSectionProps) {
  return (
    <details className="rounded-lg border border-gray-200 p-4" open={defaultOpen}>
      <summary className="cursor-pointer text-sm font-medium text-gray-700">{title}</summary>
      <div className="mt-4">{children}</div>
    </details>
  )
}

interface RepeatableSectionProps {
  title: string
  description?: string
  addLabel: string
  onAdd: () => void
  children: React.ReactNode
}

/** Card holding a list of repeatable entries (containers, documents, licences...). */
export function RepeatableSection({ title, description, addLabel, onAdd, children }: RepeatableSectionProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <SectionHeading title={title} description={description} />
        <Button variant="outline" size="sm" onClick={onAdd}>
          + {addLabel}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

interface EntryCardProps {
  title: string
  onRemove?: () => void
  removeLabel?: string
  children: React.ReactNode
}

export function EntryCard({ title, onRemove, removeLabel = 'Remove', children }: EntryCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {onRemove && (
          <Button size="sm" variant="ghost" onClick={onRemove}>
            {removeLabel}
          </Button>
        )}
      </div>
      {children}
    </div>
  )
}
