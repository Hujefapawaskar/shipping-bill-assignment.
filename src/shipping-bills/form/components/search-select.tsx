import { OptionSource, SearchOption } from '@/shipping-bills/queries'
import { useQuery } from 'core/react-query'
import { RrCaretDown } from 'icons/rr/fi-rr-caret-down'
import { useEffect, useState } from 'react'
import { getFormContext, getNestedSchema, RegisterOptions, useController } from 'ui/form'
import { InputError } from 'ui/inputs/error'
import { Label } from 'ui/inputs/label'
import { Popover, PopoverContent, PopoverTrigger } from 'ui/interactive/popover'
import { PopoverContext } from 'ui/interactive/popover-context'
import { clsx, getContext } from 'ui/utils'

interface SearchSelectProps {
  name: string
  label: string
  /** When undefined the select is shown disabled with `placeholder`. */
  source: OptionSource | undefined
  placeholder?: string
  rules?: RegisterOptions
  /** Extra control rendered next to the label, e.g. an "Add new" link. */
  action?: React.ReactNode
  onSelect?: (value: string) => void
}

export function SearchSelect({
  name,
  label,
  source,
  placeholder = 'Search & select...',
  rules,
  action,
  onSelect
}: SearchSelectProps) {
  const { hooks, schema } = getFormContext()
  const { field } = useController({
    name,
    control: hooks.control,
    rules: { ...getNestedSchema(name, schema), ...rules }
  })
  const value = (field.value as string | undefined) ?? ''
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const debouncedTerm = useDebouncedValue(term, 250)
  const key = source?.key ?? ['disabled-select']

  const selectedLabel = useQuery({
    queryKey: [...key, 'label', value],
    queryFn: () => source!.getLabel(value),
    enabled: source != null && value !== ''
  })
  const results = useQuery({
    queryKey: [...key, 'search', debouncedTerm],
    queryFn: () => source!.search(debouncedTerm),
    enabled: source != null && open
  })

  function displayValue() {
    if (value === '') return placeholder
    if (selectedLabel.isError) return value
    return selectedLabel.data ?? 'Loading...'
  }

  function pick(option: SearchOption) {
    field.onChange(option.value)
    setTerm('')
    onSelect?.(option.value)
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {action}
      </div>
      <input type="hidden" name={name} value={value} ref={field.ref} />
      <Popover placement="bottom-start" fallbackPlacements={['top-start']} onOpenCallback={setOpen}>
        <PopoverTrigger
          disabled={source == null}
          className="outline-focus-select group flex w-full cursor-pointer items-center justify-between rounded border pr-2 disabled:cursor-not-allowed disabled:opacity-50">
          <span className={clsx('truncate p-2 text-left text-sm', value ? 'text-gray-950' : 'text-gray-500')}>
            {displayValue()}
          </span>
          <RrCaretDown className="size-4 shrink-0 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
        </PopoverTrigger>
        <InputError<Record<string, unknown>> name={name} />
        <PopoverContent className="w-80 overflow-hidden rounded-md border border-gray-200 shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Type to search..."
              aria-label={`Search ${label}`}
              className="outline-focus-input w-full rounded border px-2.5 py-1.5 text-sm"
              autoFocus
            />
          </div>
          <SearchResults results={results} selectedValue={value} onPick={pick} />
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface SearchResultsProps {
  results: ReturnType<typeof useQuery<SearchOption[]>>
  selectedValue: string
  onPick: (option: SearchOption) => void
}

function SearchResults({ results, selectedValue, onPick }: SearchResultsProps) {
  const { setOpen } = getContext(PopoverContext)
  const message = 'p-3 text-center text-xs text-gray-500'

  if (results.isPending) return <div className={message}>Searching...</div>
  if (results.isError) {
    return (
      <div className={message}>
        Could not load options.{' '}
        <button
          type="button"
          className="text-primary-700 font-medium hover:underline"
          onClick={() => results.refetch()}>
          Retry
        </button>
      </div>
    )
  }
  if (results.data.length === 0) return <div className={message}>No matching results</div>

  return (
    <ul className="max-h-56 overflow-y-auto p-1">
      {results.data.map((option) => (
        <li key={option.value}>
          <button
            type="button"
            onClick={() => {
              onPick(option)
              setOpen(false)
            }}
            className={clsx(
              'flex w-full flex-col rounded p-2 text-left text-sm hover:bg-gray-100',
              option.value === selectedValue ? 'bg-primary-50 font-semibold' : null
            )}>
            <span>{option.label}</span>
            {option.hint && <span className="text-xs text-gray-500">{option.hint}</span>}
          </button>
        </li>
      ))}
    </ul>
  )
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}
