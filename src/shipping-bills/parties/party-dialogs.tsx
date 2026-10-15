import type { Branch, Business, BusinessRole, Exporter, PartyKind } from '@/services/api-types'
import { createBranch, createBusiness, createExporter } from '@/services/party-service'
import { queryKeys } from '@/services/query-keys'
import { ReferenceSelect } from '@/shipping-bills/form/components/reference-select'
import { getFormContext, InferType, s, useForm } from 'core/form'
import { Form, SubmitButton } from 'core/form/components'
import { queryClient } from 'core/react-query'
import { toast } from 'core/toast-manager'
import { Button } from 'ui/basic/button'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Textarea } from 'ui/inputs/text-area'
import { Dialog, DialogContent } from 'ui/interactive/dialog'

// Both dialogs only create records. They are opened from inside the bill <form>; DialogShell stops their
// submit events from bubbling (through the React portal) into the bill form.

const branchAddressSchema = s.object({
  branchName: s.string().minVal(2),
  address1: s.string().minVal(2),
  city: s.string().minVal(2),
  state: s.string().optional(),
  pincode: s.string().optional(),
  countryCode: s.string().requiredMsg('Select the country')
})

type BranchAddress = InferType<typeof branchAddressSchema>

const partySchema = s.object({
  name: s.string().minVal(2),
  iec: s.string().optional(),
  class: s.string().optional(),
  type: s.string().optional(),
  pan: s.string().optional(),
  tan: s.string().optional(),
  aeoNumber: s.string().optional(),
  website: s.string().optional(),
  notes: s.string().optional(),
  isConsignee: s.boolean().optional(),
  isBuyer: s.boolean().optional(),
  isNotify: s.boolean().optional(),
  isThirdParty: s.boolean().optional(),
  ...branchAddressSchema.shape
})

type PartyFormValues = InferType<typeof partySchema>

const businessRoles = [
  ['isConsignee', 'Consignee'],
  ['isBuyer', 'Buyer'],
  ['isNotify', 'Notify party'],
  ['isThirdParty', 'Third party']
] as const

const roleField: Record<BusinessRole, (typeof businessRoles)[number][0]> = {
  consignee: 'isConsignee',
  buyer: 'isBuyer',
  thirdParty: 'isThirdParty'
}

interface PartyDialogProps {
  kind: PartyKind
  /** Role the new business is created for; pre-ticked in "Used as". */
  role?: BusinessRole
  onClose: () => void
  onCreated: (party: Exporter | Business) => void
}

export function PartyDialog({ kind, role, onClose, onCreated }: PartyDialogProps) {
  const isExporter = kind === 'exporter'
  const formCtx = useForm<PartyFormValues>(partySchema, {
    defaultValues: {
      name: '',
      iec: '',
      class: isExporter ? 'F' : undefined,
      type: isExporter ? 'P' : undefined,
      ...(role ? { [roleField[role]]: true } : {}),
      branchName: '',
      address1: '',
      city: '',
      countryCode: isExporter ? 'IN' : ''
    }
  })
  const { register } = formCtx.hooks

  async function handleSave(values: PartyFormValues) {
    const firstBranch = {
      branchName: values.branchName,
      address1: values.address1,
      city: values.city,
      state: values.state,
      pincode: values.pincode,
      countryCode: values.countryCode
    }
    const party = isExporter
      ? await createExporter({
          name: values.name.trim(),
          iec: values.iec?.trim() ?? '',
          class: values.class ?? 'F',
          type: values.type ?? 'P',
          pan: values.pan,
          tan: values.tan,
          aeoNumber: values.aeoNumber,
          website: values.website,
          notes: values.notes,
          firstBranch
        })
      : await createBusiness({
          name: values.name.trim(),
          iec: values.iec,
          isConsignee: Boolean(values.isConsignee),
          isBuyer: Boolean(values.isBuyer),
          isNotify: Boolean(values.isNotify),
          isThirdParty: Boolean(values.isThirdParty),
          firstBranch
        })
    await queryClient.invalidateQueries({ queryKey: queryKeys.parties })
    toast.success(`${isExporter ? 'Exporter' : 'Business'} added`)
    onCreated(party)
    onClose()
  }

  return (
    <DialogShell
      title={`Add ${kind}`}
      description="Add the main details and one address. You can add more branches later."
      onClose={onClose}>
      <Form ctx={formCtx} handleSubmit={handleSave} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" {...register('name')} wrapClass="sm:col-span-2" />
          <Input label="IEC" {...register('iec')} />
          {isExporter ? (
            <>
              <ReferenceSelect<PartyFormValues> list="exporterClasses" label="Exporter class" name="class" />
              <ReferenceSelect<PartyFormValues> list="exporterTypes" label="Exporter type" name="type" />
            </>
          ) : (
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-sm font-medium">Used as</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {businessRoles.map(([name, label]) => (
                  <label key={name} className="flex items-center gap-2">
                    <Checkbox {...register(name)} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
        {isExporter && (
          <details className="rounded-lg border border-gray-200 p-3">
            <summary className="cursor-pointer text-sm font-medium">More exporter details</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="PAN" {...register('pan')} />
              <Input label="TAN" {...register('tan')} />
              <Input label="AEO number" {...register('aeoNumber')} />
              <Input label="Website" {...register('website')} />
              <Textarea label="Notes" {...register('notes')} wrapClass="sm:col-span-2" />
            </div>
          </details>
        )}
        <section className="border-t border-gray-200 pt-4">
          <h3 className="mb-3 font-medium">First branch</h3>
          <BranchFields />
        </section>
        <DialogActions onClose={onClose} submitLabel={`Save ${kind}`} />
      </Form>
    </DialogShell>
  )
}

const branchSchema = s.object({
  ...branchAddressSchema.shape,
  address2: s.string().optional(),
  email: s.string().optional(),
  mobile: s.string().optional(),
  gstnId: s.string().optional(),
  adCode: s.string().optional(),
  accountNo: s.string().optional(),
  ifscCode: s.string().optional()
})

type BranchFormValues = InferType<typeof branchSchema>

interface BranchDialogProps {
  kind: PartyKind
  ownerId: number
  onClose: () => void
  onCreated: (branch: Branch) => void
}

export function BranchDialog({ kind, ownerId, onClose, onCreated }: BranchDialogProps) {
  const formCtx = useForm<BranchFormValues>(branchSchema, {
    defaultValues: { branchName: '', address1: '', city: '', countryCode: kind === 'exporter' ? 'IN' : '' }
  })
  const { register } = formCtx.hooks

  async function handleSave(values: BranchFormValues) {
    const branch = await createBranch(kind, ownerId, values)
    await queryClient.invalidateQueries({ queryKey: queryKeys.parties })
    toast.success('Branch added')
    onCreated(branch)
    onClose()
  }

  return (
    <DialogShell title="Add branch" onClose={onClose}>
      <Form ctx={formCtx} handleSubmit={handleSave} className="space-y-5">
        <BranchFields />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Address line 2" {...register('address2')} />
          <Input label="Email" type="email" {...register('email')} />
          <Input label="Mobile" {...register('mobile')} />
          <Input label="GSTIN / tax ID" {...register('gstnId')} />
        </div>
        {kind === 'exporter' && (
          <details className="rounded-lg border border-gray-200 p-3">
            <summary className="cursor-pointer text-sm font-medium">Bank and customs details</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="AD code" {...register('adCode')} />
              <Input label="Account number" {...register('accountNo')} />
              <Input label="IFSC code" {...register('ifscCode')} />
            </div>
          </details>
        )}
        <DialogActions onClose={onClose} submitLabel="Save branch" />
      </Form>
    </DialogShell>
  )
}

/** Address fields shared by the "first branch" of a new party and the branch dialog (both forms contain them). */
function BranchFields() {
  const { register } = getFormContext<BranchAddress>().hooks
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Branch name" {...register('branchName')} />
      <Input label="Address line 1" {...register('address1')} />
      <Input label="City" {...register('city')} />
      <ReferenceSelect<BranchAddress>
        list="countries"
        label="Country"
        name="countryCode"
        placeholder="Select country"
      />
      <Input label="State / province" {...register('state')} />
      <Input label="Postal code" {...register('pincode')} />
    </div>
  )
}

function DialogShell({
  title,
  description,
  onClose,
  children
}: {
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <Dialog open setOpen={(open) => !open && onClose()}>
      <DialogContent center>
        <div
          className="foreground max-h-[90vh] w-[min(92vw,42rem)] overflow-y-auto rounded-xl border border-gray-200 p-6 shadow-xl"
          onSubmit={(event) => event.stopPropagation()}>
          <div className="mb-5">
            <h2 className="text-lg font-semibold capitalize">{title}</h2>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DialogActions({ onClose, submitLabel }: { onClose: () => void; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <SubmitButton>{submitLabel}</SubmitButton>
    </div>
  )
}
