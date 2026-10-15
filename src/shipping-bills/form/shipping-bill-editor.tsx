import type { ShippingBill } from '@/services/api-types'
import { queryKeys } from '@/services/query-keys'
import { saveShippingBillDraft, submitShippingBill } from '@/services/shipping-bill-service'
import { routes } from '@/shared/route-paths'
import { emptyBill } from '@/shipping-bills/model/defaults'
import { ShippingBillFormValues } from '@/shipping-bills/model/types'
import { workflowSteps } from '@/shipping-bills/workflow'
import { useForm } from 'core/form'
import { Form, SubmitButton } from 'core/form/components'
import { queryClient, useMutation } from 'core/react-query'
import { navigate } from 'core/routing'
import { toast } from 'core/toast-manager'
import { useEffect, useRef, useState } from 'react'
import { Badge } from 'ui/basic/badge'
import { Button } from 'ui/basic/button'
import { UseFormReturn } from 'ui/form'
import { Tabs, TabsList, TabsTrigger } from 'ui/interactive/tabs'
import { clsx } from 'ui/utils'
import { billSchema } from './bill-schema'
import { DetailsTab } from './sections/details-tab'
import { InvoicesTab } from './sections/invoices-tab'
import { OthersTab } from './sections/others-tab'

type BillTab = 'details' | 'invoices' | 'others'

const tabs: { id: BillTab; title: string }[] = [
  { id: 'details', title: '1. Details' },
  { id: 'invoices', title: '2. Invoices & goods' },
  { id: 'others', title: '3. Others' }
]

export function ShippingBillEditor({ bill }: { bill?: ShippingBill }) {
  const formCtx = useForm<ShippingBillFormValues>(billSchema, { defaultValues: bill?.values ?? emptyBill() })
  const { getValues, setValue } = formCtx.hooks
  const [activeTab, setActiveTab] = useState<BillTab>('details')
  // Id of the persisted bill; set after the first draft save of a new bill.
  const [billId, setBillId] = useState(bill?.id)
  const tabIndex = tabs.findIndex((tab) => tab.id === activeTab)

  useShowFirstInvalidTab(formCtx.hooks, setActiveTab)
  const lastSubmitted = useResetAfterSubmit(formCtx.hooks)

  function storeSaved(saved: ShippingBill) {
    setBillId(saved.id)
    if (!getValues('jobNumber')) setValue('jobNumber', saved.values.jobNumber)
    queryClient.setQueryData(queryKeys.bill(saved.id), saved)
    void queryClient.invalidateQueries({ queryKey: queryKeys.bills, exact: true })
  }

  const draft = useMutation({
    mutationFn: (values: ShippingBillFormValues) => saveShippingBillDraft(values, billId),
    onSuccess: storeSaved
  })

  // Failures are reported by the query client's default mutation error toast; the user stays on the tab.
  function saveDraftAndGo(tab: BillTab) {
    draft.mutate(getValues(), {
      onSuccess: () => {
        toast.success('Draft saved')
        setActiveTab(tab)
      }
    })
  }

  // Errors thrown here are shown by <Form> as an alert above the form.
  async function handleSubmit(values: ShippingBillFormValues) {
    const saved = await submitShippingBill(values, billId)
    storeSaved(saved)
    lastSubmitted.current = saved.values
    toast.success(bill ? 'Shipping bill updated' : 'Shipping bill created')
    if (saved.id !== bill?.id) navigate(routes.toShippingBillEdit(saved.id), { replace: true })
  }

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          className="mb-2 text-sm text-gray-500 hover:underline"
          onClick={() => navigate(routes.dashboard)}>
          ← Shipping bills
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-950">
            {bill ? `Edit shipping bill #${bill.values.jobNumber ?? bill.id}` : 'New shipping bill'}
          </h1>
          {bill && <Badge variant={bill.status === 'complete' ? 'success' : 'secondary'}>{bill.status}</Badge>}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Enter the everyday details first. Open advanced sections only when needed.
        </p>
      </div>
      <WorkflowSteps />

      <Form ctx={formCtx} handleSubmit={handleSubmit} className="space-y-5">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BillTab)}>
          <TabsList className="flex w-full justify-start overflow-x-auto">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {/* Every tab stays mounted (only hidden) so all fields are validated together on submit. */}
          <TabPanel active={activeTab === 'details'}>
            <DetailsTab />
          </TabPanel>
          <TabPanel active={activeTab === 'invoices'}>
            <InvoicesTab />
          </TabPanel>
          <TabPanel active={activeTab === 'others'}>
            <OthersTab />
          </TabPanel>
        </Tabs>

        <div className="flex flex-wrap justify-between gap-2 border-t border-gray-200 pt-4">
          <Button variant="outline" onClick={() => navigate(routes.dashboard)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {tabIndex > 0 && (
              <Button variant="outline" loading={draft.isPending} onClick={() => saveDraftAndGo(tabs[tabIndex - 1].id)}>
                Previous
              </Button>
            )}
            {tabIndex < tabs.length - 1 ? (
              <Button loading={draft.isPending} onClick={() => saveDraftAndGo(tabs[tabIndex + 1].id)}>
                Save & Next
              </Button>
            ) : (
              <SubmitButton>Save changes</SubmitButton>
            )}
          </div>
        </div>
      </Form>
    </div>
  )
}

function TabPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div role="tabpanel" hidden={!active} className="mt-3">
      {children}
    </div>
  )
}

function WorkflowSteps() {
  return (
    <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {workflowSteps.map((step, index) => (
        <li
          key={step.id}
          className={clsx(
            'rounded-lg border p-3',
            step.id === 'shipping-bill' ? 'border-primary-400 bg-primary-500/10' : 'border-gray-200 bg-gray-50'
          )}>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="flex size-6 items-center justify-center rounded-full bg-white text-xs">{index + 1}</span>
            {step.title}
          </div>
          <p className="ml-8 text-xs text-gray-500">{step.description}</p>
        </li>
      ))}
    </ol>
  )
}

const arrayTabs: Partial<Record<keyof ShippingBillFormValues, BillTab>> = {
  invoices: 'invoices',
  containers: 'others',
  packingRanges: 'others',
  documents: 'others',
  licenses: 'others'
}

function firstInvalidTab(errors: UseFormReturn<ShippingBillFormValues>['formState']['errors']): BillTab | undefined {
  const invalid = new Set(
    Object.keys(errors)
      .filter((key) => key !== 'root')
      .map((key) => arrayTabs[key as keyof ShippingBillFormValues] ?? 'details')
  )
  return tabs.find((tab) => invalid.has(tab.id))?.id
}

/** After a failed submit, switch to the first tab containing an error so the user can see it. */
function useShowFirstInvalidTab(form: UseFormReturn<ShippingBillFormValues>, setActiveTab: (tab: BillTab) => void) {
  const { submitCount, errors } = form.formState
  useEffect(() => {
    if (submitCount === 0) return
    const tab = firstInvalidTab(errors)
    if (tab == null) return
    setActiveTab(tab)
    toast.error('Please fix the highlighted fields')
    // Only react to a new submit attempt, not to every later change of the error set.
  }, [submitCount])
}

/**
 * <Form> keeps the form disabled after a successful submit. When the editor stays mounted (editing an existing bill),
 * reinitialize it with the saved values so it becomes editable and "clean" again.
 */
function useResetAfterSubmit(form: UseFormReturn<ShippingBillFormValues>) {
  const lastSubmitted = useRef<ShippingBillFormValues | null>(null)
  const { isSubmitSuccessful } = form.formState
  const { reset } = form
  useEffect(() => {
    if (isSubmitSuccessful && lastSubmitted.current) reset(lastSubmitted.current)
  }, [isSubmitSuccessful, reset])
  return lastSubmitted
}
