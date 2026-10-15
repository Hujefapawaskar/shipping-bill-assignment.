import {
  formatAmount,
  impliedPriceInclusion,
  invoiceTotal,
  isBlank,
  itemsTotal
} from '@/shipping-bills/model/calculations'
import { emptyInvoice, emptyItem } from '@/shipping-bills/model/defaults'
import { BillInvoiceForm } from '@/shipping-bills/model/types'
import { useReferenceList } from '@/shipping-bills/queries'
import { Button } from 'ui/basic/button'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { useFieldArray, useWatch } from 'ui/form'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { useBillForm } from '../bill-schema'
import { dateInputType } from '../components/date-input'
import { DecimalInput } from '../components/decimal-input'
import { SectionHeading } from '../components/layout'
import { ReferenceSelect } from '../components/reference-select'
import { InvoiceCharges } from './invoice-charges'
import { ItemCard } from './item-card'
import { PartyFields } from './party-fields'

export function InvoicesTab() {
  const { control } = useBillForm()
  const { fields, append, remove } = useFieldArray({ control, name: 'invoices' })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <SectionHeading title="Invoices & goods" description="Each invoice lists the goods it covers." />
        <Button variant="outline" onClick={() => append(emptyInvoice())}>
          + Add invoice
        </Button>
      </div>
      {fields.map((field, index) => (
        <InvoiceCard key={field.id} index={index} onRemove={fields.length > 1 ? () => remove(index) : undefined} />
      ))}
    </div>
  )
}

function InvoiceCard({ index, onRemove }: { index: number; onRemove?: () => void }) {
  const { control, register } = useBillForm()
  const invoice = useWatch({ control, name: `invoices.${index}` }) as BillInvoiceForm | undefined
  const items = useFieldArray({ control, name: `invoices.${index}.items` })
  const priceInclusions = useReferenceList('priceInclusionTypes')

  if (!invoice) return null
  const impliedInclusion = priceInclusions.data?.find(
    (option) => option.value === impliedPriceInclusion(invoice.contractType)
  )

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <h3 className="font-semibold">Invoice {index + 1}</h3>
        {onRemove && (
          <Button size="sm" variant="ghost" onClick={onRemove}>
            Remove invoice
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Invoice number" {...register(`invoices.${index}.invoiceNumber`)} />
          <Input label="Invoice date" type={dateInputType} {...register(`invoices.${index}.invoiceDate`)} />
          <ReferenceSelect
            list="currencies"
            label="Currency"
            name={`invoices.${index}.currency`}
            rules={{ required: true }}
          />
          <ReferenceSelect
            list="contractTypes"
            label="Contract"
            name={`invoices.${index}.contractType`}
            rules={{ required: true }}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox {...register(`invoices.${index}.buyerSameAsConsignee`)} />
          Buyer & consignee are the same
        </label>
        {!invoice.buyerSameAsConsignee && (
          <PartyFields
            ownerName={`invoices.${index}.buyerId`}
            branchName={`invoices.${index}.buyerBranchId`}
            label="Buyer"
            party={{ kind: 'business', role: 'buyer' }}
          />
        )}

        <InvoiceCharges invoiceIndex={index} currency={invoice.currency} contractType={invoice.contractType} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReferenceSelect
            list="priceInclusionTypes"
            label="Price includes"
            name={`invoices.${index}.freightInsuranceIncluded`}
            placeholder={impliedInclusion ? `${impliedInclusion.label} (from contract)` : 'From contract type'}
          />
          <Input label="Contract / order number" {...register(`invoices.${index}.contractNumber`)} />
          <ReferenceSelect
            list="paymentTypes"
            label="Payment type"
            name={`invoices.${index}.natureOfPayment`}
            placeholder="Select if applicable"
          />
          <Input label="Payment period (days)" type="number" {...register(`invoices.${index}.periodOfPayment`)} />
        </div>

        <PartyFields
          ownerName={`invoices.${index}.thirdPartyId`}
          branchName={`invoices.${index}.thirdPartyBranchId`}
          label="Third party (optional)"
          party={{ kind: 'business', role: 'thirdParty' }}
          required={false}
        />

        <div className="space-y-4 border-t border-gray-200 pt-5">
          <div className="flex items-center justify-between gap-2">
            <SectionHeading title="Goods" />
            <Button size="sm" variant="outline" onClick={() => items.append(emptyItem())}>
              + Add item
            </Button>
          </div>
          {items.fields.map((field, itemIndex) => (
            <ItemCard
              key={field.id}
              invoiceIndex={index}
              itemIndex={itemIndex}
              currency={invoice.currency}
              onRemove={items.fields.length > 1 ? () => items.remove(itemIndex) : undefined}
            />
          ))}
        </div>

        <InvoiceTotal index={index} invoice={invoice} />
      </CardContent>
    </Card>
  )
}

function InvoiceTotal({ index, invoice }: { index: number; invoice: BillInvoiceForm }) {
  const { register } = useBillForm()
  const computed = itemsTotal(invoice)
  const declaredDiffers = !isBlank(invoice.invoiceTotal) && Math.abs(invoiceTotal(invoice) - computed) > 0.005

  return (
    <div className="flex flex-wrap items-end justify-end gap-4 border-t border-gray-200 pt-4">
      <DecimalInput
        label="Declared invoice total (optional)"
        placeholder={formatAmount(computed)}
        wrapClass="w-60"
        {...register(`invoices.${index}.invoiceTotal`)}
      />
      <div className="pb-2 text-right text-sm">
        <div className="font-semibold">Items total: {formatAmount(computed, invoice.currency)}</div>
        {declaredDiffers && <div className="text-yellow-700">Declared total differs from the sum of items</div>}
      </div>
    </div>
  )
}
