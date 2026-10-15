import { isBlank, priceComponents } from '@/shipping-bills/model/calculations'
import { ShippingBillFormValues } from '@/shipping-bills/model/types'
import { useWatch } from 'ui/form'
import { useBillForm } from '../bill-schema'
import { DecimalInput } from '../components/decimal-input'
import { ReferenceSelect } from '../components/reference-select'

type ChargeKey = 'freight' | 'insurance' | 'commission' | 'discount' | 'otherDeductions'

const charges: { key: ChargeKey; label: string }[] = [
  { key: 'freight', label: 'Freight' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'commission', label: 'Commission' },
  { key: 'discount', label: 'Discount' },
  { key: 'otherDeductions', label: 'Other deductions' }
]

interface InvoiceChargesProps {
  invoiceIndex: number
  currency: string
  contractType: string
}

/** Price adjustments of an invoice. Each charge is entered either as a % rate or as an amount, not both. */
export function InvoiceCharges({ invoiceIndex, currency, contractType }: InvoiceChargesProps) {
  const { register } = useBillForm()
  const included = priceComponents(contractType)

  return (
    <div className="grid grid-cols-1 gap-x-6 rounded-lg border border-gray-200 p-3 lg:grid-cols-2">
      {charges.map(({ key, label }) => (
        <ChargeRow
          key={key}
          invoiceIndex={invoiceIndex}
          charge={key}
          label={label}
          currency={currency}
          requiredBy={key === 'freight' || key === 'insurance' ? (included[key] ? contractType : undefined) : undefined}
        />
      ))}
      <div className="flex items-start gap-2 py-2">
        <span className="w-32 shrink-0 pt-2 text-sm font-medium">Packing charges</span>
        <DecimalInput
          placeholder="Amount"
          className="text-right"
          {...register(`invoices.${invoiceIndex}.packingCharges`)}
        />
      </div>
    </div>
  )
}

interface ChargeRowProps {
  invoiceIndex: number
  charge: ChargeKey
  label: string
  currency: string
  /** Contract type that makes this charge mandatory (e.g. CIF → freight), if any. */
  requiredBy?: string
}

function ChargeRow({ invoiceIndex, charge, label, currency, requiredBy }: ChargeRowProps) {
  const { control, register } = useBillForm()
  const base = `invoices.${invoiceIndex}` as const
  const [rate, amount] = useWatch({ control, name: [`${base}.${charge}Rate`, `${base}.${charge}Amount`] })

  function validateAmount(value: string | undefined, values: ShippingBillFormValues) {
    const rateEntered = !isBlank(values.invoices[invoiceIndex]?.[`${charge}Rate`])
    if (!requiredBy || rateEntered || !isBlank(value)) return undefined
    return `Required for ${requiredBy}: enter a rate or an amount`
  }

  return (
    <div className="flex flex-wrap items-start gap-2 py-2 lg:flex-nowrap">
      <span className="w-32 shrink-0 pt-2 text-sm font-medium">
        {label}
        {requiredBy && <span className="text-red-500"> *</span>}
      </span>
      <div className="flex items-center gap-1">
        <DecimalInput
          placeholder="Rate"
          className="w-24 text-right"
          disabled={!isBlank(amount)}
          {...register(`${base}.${charge}Rate`)}
        />
        <span className="text-xs text-gray-500">%</span>
      </div>
      <DecimalInput
        placeholder="Amount"
        className="text-right"
        disabled={!isBlank(rate)}
        {...register(`${base}.${charge}Amount`, { validate: validateAmount })}
      />
      <ReferenceSelect
        list="currencies"
        name={`${base}.${charge}Currency`}
        placeholder={currency}
        wrapClass="w-28 shrink-0"
      />
    </div>
  )
}
