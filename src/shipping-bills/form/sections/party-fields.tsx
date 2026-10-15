import type { BusinessRole, PartyKind } from '@/services/api-types'
import { ShippingBillFormValues } from '@/shipping-bills/model/types'
import { BranchDialog, PartyDialog } from '@/shipping-bills/parties/party-dialogs'
import { branchSource, businessSource, exporterSource } from '@/shipping-bills/queries'
import { useState } from 'react'
import { Path, useWatch } from 'ui/form'
import { useBillForm } from '../bill-schema'
import { SearchSelect } from '../components/search-select'

type PartyType = { kind: 'exporter' } | { kind: 'business'; role: BusinessRole }

interface PartyFieldsProps {
  /** Form path holding the party id, e.g. "exporterId" or "invoices.0.buyerId". */
  ownerName: Path<ShippingBillFormValues>
  /** Form path holding the selected branch id of that party. */
  branchName: Path<ShippingBillFormValues>
  label: string
  party: PartyType
  required?: boolean
  /** Called after the user picks or creates a different party. */
  onPartyChange?: () => void
}

/** Party + branch pair with inline "add new" dialogs. Changing the party clears its branch. */
export function PartyFields({ ownerName, branchName, label, party, required = true, onPartyChange }: PartyFieldsProps) {
  const { control, setValue } = useBillForm()
  const ownerId = useWatch({ control, name: ownerName }) as string | undefined
  const [dialog, setDialog] = useState<'party' | 'branch' | null>(null)
  const kind: PartyKind = party.kind
  const noun = party.kind === 'exporter' ? 'exporter' : roleNoun[party.role]

  function selectParty(partyId: string, branchId = '') {
    setValue(ownerName, partyId, { shouldDirty: true, shouldValidate: true })
    setValue(branchName, branchId, { shouldDirty: true, shouldValidate: branchId !== '' })
    onPartyChange?.()
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SearchSelect
        name={ownerName}
        label={label}
        source={party.kind === 'exporter' ? exporterSource : businessSource(party.role)}
        placeholder={`Search ${noun}...`}
        rules={{ required: required && `Select the ${noun}` }}
        onSelect={(value) => value !== ownerId && selectParty(value)}
        action={<LinkButton onClick={() => setDialog('party')}>+ Add new</LinkButton>}
      />
      <SearchSelect
        name={branchName}
        label="Branch / address"
        source={ownerId ? branchSource(kind, Number(ownerId)) : undefined}
        placeholder={ownerId ? 'Search branch...' : `Choose ${label.toLowerCase()} first`}
        rules={{ required: Boolean(ownerId) && 'Select the branch' }}
        action={ownerId ? <LinkButton onClick={() => setDialog('branch')}>+ Add branch</LinkButton> : null}
      />
      {dialog === 'party' && (
        <PartyDialog
          kind={kind}
          role={party.kind === 'business' ? party.role : undefined}
          onClose={() => setDialog(null)}
          onCreated={(created) => selectParty(String(created.id), String(created.branches[0]?.id ?? ''))}
        />
      )}
      {dialog === 'branch' && ownerId && (
        <BranchDialog
          kind={kind}
          ownerId={Number(ownerId)}
          onClose={() => setDialog(null)}
          onCreated={(branch) => setValue(branchName, String(branch.id), { shouldDirty: true, shouldValidate: true })}
        />
      )}
    </div>
  )
}

const roleNoun: Record<BusinessRole, string> = { consignee: 'consignee', buyer: 'buyer', thirdParty: 'third party' }

function LinkButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="text-primary-700 text-xs font-medium hover:underline" onClick={onClick}>
      {children}
    </button>
  )
}
