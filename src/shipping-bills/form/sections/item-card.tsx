import { formatAmount, lineTotal } from '@/shipping-bills/model/calculations'
import { BillItemForm } from '@/shipping-bills/model/types'
import { useReferenceList } from '@/shipping-bills/queries'
import { useWatch } from 'ui/form'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { useBillForm } from '../bill-schema'
import { dateInputType } from '../components/date-input'
import { DecimalInput } from '../components/decimal-input'
import { AdvancedSection, EntryCard } from '../components/layout'
import { ReferenceSelect } from '../components/reference-select'
import { PartyFields } from './party-fields'

interface ItemCardProps {
  invoiceIndex: number
  itemIndex: number
  currency: string
  onRemove?: () => void
}

export function ItemCard({ invoiceIndex, itemIndex, currency, onRemove }: ItemCardProps) {
  const { control, register } = useBillForm()
  const item = useWatch({ control, name: `invoices.${invoiceIndex}.items.${itemIndex}` }) as BillItemForm | undefined
  const schemes = useReferenceList('schemeCodes')

  function field<K extends keyof BillItemForm>(name: K) {
    return `invoices.${invoiceIndex}.items.${itemIndex}.${name}` as const
  }

  if (!item) return null
  const claimsIncentive = schemes.data?.find((scheme) => scheme.value === item.schemeCode)?.hasExportIncentive === true

  return (
    <EntryCard title={`Item ${itemIndex + 1}`} onRemove={onRemove}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Input label="RITC / HS code" placeholder="e.g. 61091000" {...register(field('ritcCode'))} />
          <ReferenceSelect
            list="schemeCodes"
            label="Scheme code"
            name={field('schemeCode')}
            placeholder="Select scheme"
          />
          <Input
            label="Goods description"
            placeholder="e.g. Cotton T-shirts"
            wrapClass="lg:col-span-4"
            {...register(field('goodsDescription1'))}
          />
          <DecimalInput label="Quantity" {...register(field('quantity'))} />
          <ReferenceSelect
            list="quantityUnits"
            label="Unit"
            name={field('unitOfMeasurement')}
            rules={{ required: true }}
          />
          <DecimalInput label={`Unit price (${currency})`} {...register(field('unitPrice'))} />
          <DecimalInput
            label="Item total"
            placeholder={formatAmount(lineTotal({ ...item, lineTotal: '' }), currency)}
            {...register(field('lineTotal'))}
          />
          <ReferenceSelect
            list="igstPaymentStatuses"
            label="IGST payment"
            name={field('igstPaymentStatus')}
            placeholder="Select if applicable"
          />
          {item.igstPaymentStatus === 'P' && (
            <>
              <DecimalInput label="Taxable value" {...register(field('taxableValue'))} />
              <DecimalInput label="IGST amount" {...register(field('igstAmount'))} />
            </>
          )}
        </div>

        {claimsIncentive && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Drawback serial no." {...register(field('drawbackSerialNumber'))} />
            <Input label="Drawback unit" {...register(field('drawbackUnit'))} />
            <DecimalInput label="Drawback quantity" {...register(field('drawbackQuantity'))} />
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox {...register(field('rewardItem'))} />
            Claim reward
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox {...register(field('thirdPartyItem'))} />
            Third-party item
          </label>
        </div>

        {item.thirdPartyItem && (
          <PartyFields
            ownerName={field('itemThirdPartyId')}
            branchName={field('itemThirdPartyBranchId')}
            label="Item third party"
            party={{ kind: 'business', role: 'thirdParty' }}
          />
        )}

        <AdvancedSection title="Item customs, taxes and incentives">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ReferenceSelect
              list="quantityUnits"
              label="Unit of rate"
              name={field('unitOfRate')}
              placeholder={item.unitOfMeasurement || 'Same as unit'}
            />
            <DecimalInput label="Per unit (rate)" placeholder="1" {...register(field('numberOfUnits'))} />
            <DecimalInput label="Present market value" {...register(field('presentMarketValue'))} />
            <DecimalInput label="GCess" {...register(field('cess'))} />
            <Input
              label="Accessories description"
              wrapClass="lg:col-span-3"
              {...register(field('accessoriesDescription'))}
            />
            <ReferenceSelect
              list="accessoryStatuses"
              label="Accessory status"
              name={field('accessoryStatus')}
              placeholder="Select if relevant"
            />
            <Input label="Origin district code" {...register(field('originDistrictCode'))} />
            <ReferenceSelect
              list="tradeAgreements"
              label="Trade agreement code"
              name={field('tradeAgreementsCode')}
              placeholder="NCPTI"
            />
            <Input label="End use code" {...register(field('endUseOfItem'))} />
            <Input label="Packages for item" type="number" {...register(field('totalPackage'))} />
            <Input label="AR4 number" {...register(field('ar4Number'))} />
            <Input label="AR4 date" type={dateInputType} {...register(field('ar4Date'))} />
          </div>
        </AdvancedSection>
      </div>
    </EntryCard>
  )
}
