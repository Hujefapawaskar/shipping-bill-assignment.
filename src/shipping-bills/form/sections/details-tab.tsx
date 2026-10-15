import { portCountry } from '@/shipping-bills/model/calculations'
import { ShippingBillFormValues } from '@/shipping-bills/model/types'
import { destinationPortSource, loadingPortSource, useMarksAndNumbers } from '@/shipping-bills/queries'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { useWatch } from 'ui/form'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { useBillForm } from '../bill-schema'
import { dateInputType } from '../components/date-input'
import { DecimalInput } from '../components/decimal-input'
import { AdvancedSection, SectionHeading } from '../components/layout'
import { FieldStatus, ReferenceSelect } from '../components/reference-select'
import { SearchSelect } from '../components/search-select'
import { PartyFields } from './party-fields'

export function DetailsTab() {
  const { register, setValue } = useBillForm()

  return (
    <Card>
      <CardHeader title="Shipment basics" description="Parties and route are the core details for this bill." />
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Job number" placeholder="Assigned on first save" {...register('jobNumber')} />
          <Input label="Job date" type={dateInputType} {...register('jobDate')} />
        </div>
        <PartyFields
          ownerName="exporterId"
          branchName="exporterBranchId"
          label="Exporter"
          party={{ kind: 'exporter' }}
          onPartyChange={() => setValue('marksAndNumbers', '')}
        />
        <PartyFields
          ownerName="consigneeId"
          branchName="consigneeBranchId"
          label="Consignee"
          party={{ kind: 'business', role: 'consignee' }}
        />
        <RouteFields />
        <PackageFields />
      </CardContent>
    </Card>
  )
}

function RouteFields() {
  const { control, register } = useBillForm()
  const [loadingPort, destinationPort] = useWatch({ control, name: ['loadingPort', 'finalDestinationPort'] })

  return (
    <div className="space-y-4 border-t border-gray-200 pt-5">
      <SectionHeading title="Route" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SearchSelect
          name="loadingPort"
          label="Port of loading"
          source={loadingPortSource}
          placeholder="Select Indian port"
        />
        <SearchSelect
          name="finalDestinationPort"
          label="Final destination port"
          source={destinationPortSource}
          placeholder="Select destination"
        />
      </div>
      <p className="text-xs text-gray-500">
        Countries are derived from the port codes: {portCountry(loadingPort) || '—'} →{' '}
        {portCountry(destinationPort) || '—'}
      </p>
      <AdvancedSection title="Regulatory and route exceptions">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReferenceSelect
            list="dischargePorts"
            label="Discharge port"
            name="dischargePort"
            placeholder="Defaults to destination"
          />
          <ReferenceSelect
            list="states"
            label="Origin state"
            name="originStateCode"
            placeholder="Defaults to branch state"
          />
          <ReferenceSelect
            list="nfeiCategories"
            label="NFEI category"
            name="nfeiCategory"
            placeholder="Not applicable"
          />
          <Input label="RBI waiver number" {...register('rbiWaiverNumber')} />
          <Input label="RBI waiver date" type={dateInputType} {...register('rbiWaiverDate')} />
        </div>
      </AdvancedSection>
    </div>
  )
}

function PackageFields() {
  const { control, register } = useBillForm()
  const containerCount = useWatch({ control, name: 'containers' }).length

  return (
    <div className="space-y-4 border-t border-gray-200 pt-5">
      <SectionHeading title="Package details" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReferenceSelect list="cargoNatures" label="Nature of cargo" name="natureOfCargo" />
        <DecimalInput label="Gross weight" {...register('grossWeight')} />
        <DecimalInput label="Net weight" {...register('netWeight')} />
        <ReferenceSelect list="weightUnits" label="Weight unit" name="measurementUnit" />
        <Input label="Total packages" type="number" {...register('totalPackages')} />
        <MarksAndNumbersSelect />
      </div>
      <AdvancedSection title="Additional details">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReferenceSelect list="sealTypes" label="Seal type" name="sealType" placeholder="Select if relevant" />
          {containerCount === 0 && (
            <Input label="Number of containers" type="number" {...register('numberOfContainers')} />
          )}
          <Input label="Loose packets" type="number" {...register('loosePackets')} />
          <Input label="MAWB number" {...register('mawbNumber')} />
          <Input label="HAWB number" {...register('hawbNumber')} />
        </div>
      </AdvancedSection>
    </div>
  )
}

/** Shipping-mark templates registered for the selected exporter. */
function MarksAndNumbersSelect() {
  const { control } = useBillForm()
  const exporterId = useWatch({ control, name: 'exporterId' })
  const marks = useMarksAndNumbers(exporterId)
  const label = 'Marks and numbers'
  const wrapClass = 'sm:col-span-3'

  if (!exporterId) return <FieldStatus label={label} wrapClass={wrapClass} text="Select the exporter first" />
  if (marks.isPending) return <FieldStatus label={label} wrapClass={wrapClass} text="Loading..." />
  if (marks.isError) {
    return (
      <FieldStatus label={label} wrapClass={wrapClass} text="Could not load marks" onRetry={() => marks.refetch()} />
    )
  }
  if (marks.data.length === 0) {
    return <FieldStatus label={label} wrapClass={wrapClass} text="No marks registered for this exporter" />
  }
  return (
    <Select<ShippingBillFormValues>
      label={label}
      name="marksAndNumbers"
      wrapClass={wrapClass}
      placeholder="Select marks and numbers"
      options={marks.data.map((mark) => ({ value: mark, label: mark }))}
    />
  )
}
