import { containerizedCargoCodes, isBlank } from '@/shipping-bills/model/calculations'
import { emptyContainer, emptyDocument, emptyLicense, emptyPackingRange } from '@/shipping-bills/model/defaults'
import { ShippingBillFormValues, SupportingDocForm } from '@/shipping-bills/model/types'
import { documentTypeSource } from '@/shipping-bills/queries'
import { Button } from 'ui/basic/button'
import { useFieldArray, useWatch } from 'ui/form'
import { Input } from 'ui/inputs/input'
import { useBillForm } from '../bill-schema'
import { dateInputType } from '../components/date-input'
import { DecimalInput } from '../components/decimal-input'
import { AdvancedSection, EntryCard, RepeatableSection } from '../components/layout'
import { ReferenceSelect } from '../components/reference-select'
import { SearchSelect } from '../components/search-select'

export function OthersTab() {
  return (
    <div className="space-y-4">
      <ContainersSection />
      <DocumentsSection />
      <LicensesSection />
    </div>
  )
}

function ContainersSection() {
  const { control, register } = useBillForm()
  const containers = useFieldArray({ control, name: 'containers' })
  const natureOfCargo = useWatch({ control, name: 'natureOfCargo' })
  const missingContainers = containerizedCargoCodes.includes(natureOfCargo) && containers.fields.length === 0

  return (
    <RepeatableSection
      title={`Containers (${containers.fields.length})`}
      description="Add only when the cargo is containerized."
      addLabel="Add container"
      onAdd={() => containers.append(emptyContainer())}>
      {missingContainers && (
        <p className="text-sm text-yellow-700">Nature of cargo is containerized: add the container details below.</p>
      )}
      {containers.fields.map((field, index) => (
        <EntryCard key={field.id} title={`Container ${index + 1}`} onRemove={() => containers.remove(index)}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Container number"
              placeholder="e.g. MSKU1234565"
              {...register(`containers.${index}.containerNumber`, {
                setValueAs: (value: string) => value.trim().toUpperCase()
              })}
            />
            <ReferenceSelect
              list="containerSizes"
              label="Size"
              name={`containers.${index}.containerSize`}
              placeholder="Select size"
            />
            <Input label="Seal number" {...register(`containers.${index}.exciseSealNumber`)} />
            <Input label="Seal date" type={dateInputType} {...register(`containers.${index}.sealDate`)} />
            <ReferenceSelect
              list="containerSealTypes"
              label="Seal type"
              name={`containers.${index}.sealType`}
              placeholder="Select if needed"
            />
            <Input label="Seal device ID" {...register(`containers.${index}.sealDeviceId`)} />
            <Input label="Movement document type" {...register(`containers.${index}.movementDocumentType`)} />
            <Input label="Movement document number" {...register(`containers.${index}.movementDocumentNumber`)} />
          </div>
        </EntryCard>
      ))}
      <PackingRanges />
    </RepeatableSection>
  )
}

function PackingRanges() {
  const { control, register } = useBillForm()
  const ranges = useFieldArray({ control, name: 'packingRanges' })

  function validateRangeEnd(to: string, values: ShippingBillFormValues, index: number) {
    if (isBlank(to)) return 'Enter a package number'
    const from = values.packingRanges[index]?.packingNumberFrom
    return !isBlank(from) && Number(to) < Number(from) ? '"To" must not be lower than "from"' : undefined
  }

  return (
    <AdvancedSection title={`Packing list ranges (${ranges.fields.length})`} defaultOpen={ranges.fields.length > 0}>
      <div className="space-y-3">
        {ranges.fields.map((field, index) => (
          <EntryCard key={field.id} title={`Range ${index + 1}`} onRemove={() => ranges.remove(index)}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Package from" type="number" {...register(`packingRanges.${index}.packingNumberFrom`)} />
              <Input
                label="Package to"
                type="number"
                {...register(`packingRanges.${index}.packingNumberTo`, {
                  validate: (to: string, values) => validateRangeEnd(to, values, index)
                })}
              />
              <Input label="Packing code" placeholder="CTN" {...register(`packingRanges.${index}.packingCode`)} />
            </div>
          </EntryCard>
        ))}
        <Button variant="outline" size="sm" onClick={() => ranges.append(emptyPackingRange())}>
          + Add packing range
        </Button>
      </div>
    </AdvancedSection>
  )
}

function DocumentsSection() {
  const { control } = useBillForm()
  const documents = useFieldArray({ control, name: 'documents' })

  return (
    <RepeatableSection
      title="Supporting documents"
      description="Add references when required for this shipment."
      addLabel="Add document"
      onAdd={() => documents.append(emptyDocument())}>
      {documents.fields.map((field, index) => (
        <DocumentCard key={field.id} index={index} onRemove={() => documents.remove(index)} />
      ))}
    </RepeatableSection>
  )
}

const documentDetailFields: (keyof SupportingDocForm)[] = [
  'documentReferenceNumber',
  'documentExpiryDate',
  'invoiceSerialNumber',
  'itemSerialNumber',
  'fileType',
  'placeOfIssue',
  'issuingPartyCode',
  'issuingPartyName',
  'beneficiaryPartyCode',
  'beneficiaryPartyName'
]

function DocumentCard({ index, onRemove }: { index: number; onRemove: () => void }) {
  const { register, getValues } = useBillForm()
  const document = getValues(`documents.${index}`)
  // Open the details section up front when a saved document already has values in it.
  const hasDetails = documentDetailFields.some((key) => !isBlank(document[key]))

  function field<K extends keyof SupportingDocForm>(name: K) {
    return `documents.${index}.${name}` as const
  }

  return (
    <EntryCard title={`Document ${index + 1}`} onRemove={onRemove}>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SearchSelect name={field('documentTypeCode')} label="Document type" source={documentTypeSource} />
          <Input label="Image reference number" {...register(field('imageReferenceNumber'))} />
          <Input label="Issue date" type={dateInputType} {...register(field('documentIssueDate'))} />
        </div>
        <AdvancedSection title="Reference, issuing party and beneficiary" defaultOpen={hasDetails}>
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input label="Reference number" {...register(field('documentReferenceNumber'))} />
              <Input label="Expiry date" type={dateInputType} {...register(field('documentExpiryDate'))} />
              <Input label="Invoice serial number" type="number" {...register(field('invoiceSerialNumber'))} />
              <Input label="Item serial number" type="number" {...register(field('itemSerialNumber'))} />
              <ReferenceSelect
                list="documentFileTypes"
                label="File type"
                name={field('fileType')}
                placeholder="Select"
              />
              <Input label="Place of issue" {...register(field('placeOfIssue'))} />
            </div>
            <PartyAddressFields title="Issuing party" prefix="issuingParty" index={index} />
            <PartyAddressFields title="Beneficiary" prefix="beneficiaryParty" index={index} />
          </div>
        </AdvancedSection>
      </div>
    </EntryCard>
  )
}

function PartyAddressFields({
  title,
  prefix,
  index
}: {
  title: string
  prefix: 'issuingParty' | 'beneficiaryParty'
  index: number
}) {
  const { register } = useBillForm()
  const base = `documents.${index}.${prefix}` as const

  return (
    <div className="border-t border-gray-100 pt-4">
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input label="Code" {...register(`${base}Code`)} />
        <Input label="Name" {...register(`${base}Name`)} />
        <Input label="Address line 1" {...register(`${base}Address1`)} />
        <Input label="Address line 2" {...register(`${base}Address2`)} />
        <Input label="City" {...register(`${base}City`)} />
        <Input label="Postal code" {...register(`${base}Pin`)} />
      </div>
    </div>
  )
}

function LicensesSection() {
  const { control, register } = useBillForm()
  const licenses = useFieldArray({ control, name: 'licenses' })

  return (
    <RepeatableSection
      title="Licences"
      description="Only for schemes that require a licence (e.g. Advance Authorization, EPCG)."
      addLabel="Add licence"
      onAdd={() => licenses.append(emptyLicense())}>
      {licenses.fields.map((field, index) => (
        <EntryCard key={field.id} title={`Licence ${index + 1}`} onRemove={() => licenses.remove(index)}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Registration number" {...register(`licenses.${index}.registrationNumber`)} />
            <Input label="Registration date" type={dateInputType} {...register(`licenses.${index}.registrationDate`)} />
            <Input label="Invoice serial number" type="number" {...register(`licenses.${index}.invoiceSerialNumber`)} />
            <Input label="Item serial number" type="number" {...register(`licenses.${index}.itemSerialNumber`)} />
            <Input label="Licence serial number" type="number" {...register(`licenses.${index}.licenseSerialNumber`)} />
            <Input label="Item serial, Part E" {...register(`licenses.${index}.itemSerialNumberPartE`)} />
            <Input label="Item serial, Part C" {...register(`licenses.${index}.itemSerialNumberPartC`)} />
            <DecimalInput label="Licence quantity" {...register(`licenses.${index}.licenseQuantity`)} />
            <DecimalInput label="Export quantity" {...register(`licenses.${index}.licenseExportQuantity`)} />
            <ReferenceSelect
              list="goodsSources"
              label="Goods source"
              name={`licenses.${index}.indigenousOrImported`}
              placeholder="Select if needed"
            />
          </div>
        </EntryCard>
      ))}
    </RepeatableSection>
  )
}
