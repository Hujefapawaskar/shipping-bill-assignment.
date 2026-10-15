import { queryKeys } from '@/services/query-keys'
import { getShippingBill } from '@/services/shipping-bill-service'
import { routes } from '@/shared/route-paths'
import { useQuery } from 'core/react-query'
import { navigate, useParams } from 'core/routing'
import { InternalError } from 'core/utils'
import { Button } from 'ui/basic/button'
import { SpinnerScreen } from 'ui/notify/spinner'
import { ErrorPage } from 'ui/notify/status-page'
import { ShippingBillEditor } from './shipping-bill-editor'

/** Route component for both /shipping-bills/new and /shipping-bills/:id. */
export default function ShippingBillPage() {
  const { id } = useParams<{ id?: string }>()
  if (id == null) return <ShippingBillEditor key="new" />
  return <ExistingShippingBill key={id} id={Number(id)} />
}

function ExistingShippingBill({ id }: { id: number }) {
  const bill = useQuery({ queryKey: queryKeys.bill(id), queryFn: () => getShippingBill(id) })

  if (bill.isPending) return <SpinnerScreen />
  if (bill.isError) {
    if (bill.error instanceof InternalError && bill.error.status === 404) {
      return (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Shipping bill not found</h1>
          <Button onClick={() => navigate(routes.dashboard)}>Back to list</Button>
        </div>
      )
    }
    return <ErrorPage message="Could not load the shipping bill" />
  }
  return <ShippingBillEditor bill={bill.data} />
}
