import type { ReferenceListName } from '@/services/reference-data-service'
import { ShippingBillFormValues } from '@/shipping-bills/model/types'
import { useReferenceList } from '@/shipping-bills/queries'
import { FieldValues, Path, RegisterOptions } from 'ui/form'
import { Label } from 'ui/inputs/label'
import { Select } from 'ui/inputs/select'
import { DisallowNever } from 'ui/utils'

interface ReferenceSelectProps<T extends FieldValues> {
  list: ReferenceListName
  name: Path<DisallowNever<T>>
  label?: string
  placeholder?: string
  rules?: RegisterOptions
  wrapClass?: string
}

/** Select whose options come from the reference-data service, with loading and error states. */
export function ReferenceSelect<T extends FieldValues = ShippingBillFormValues>({
  list,
  ...props
}: ReferenceSelectProps<T>) {
  const options = useReferenceList(list)

  // The field is not rendered (so not registered) until options arrive: its current value is kept untouched.
  if (options.isPending) return <FieldStatus label={props.label} wrapClass={props.wrapClass} text="Loading..." />
  if (options.isError) {
    return (
      <FieldStatus
        label={props.label}
        wrapClass={props.wrapClass}
        text="Could not load options"
        onRetry={() => options.refetch()}
      />
    )
  }
  return <Select<T> {...props} options={options.data} />
}

interface FieldStatusProps {
  label?: string
  text: string
  wrapClass?: string
  onRetry?: () => void
}

/** Read-only stand-in for a field that cannot be used yet (loading, failed, or waiting on another field). */
export function FieldStatus({ label, text, wrapClass, onRetry }: FieldStatusProps) {
  return (
    <div className={wrapClass}>
      {label && <Label className="mb-1.5 block">{label}</Label>}
      <div className="flex min-h-[38px] items-center justify-between gap-2 rounded border border-dashed px-2 text-sm text-gray-500">
        <span>{text}</span>
        {onRetry && (
          <button type="button" className="text-primary-700 text-xs font-medium hover:underline" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  )
}
