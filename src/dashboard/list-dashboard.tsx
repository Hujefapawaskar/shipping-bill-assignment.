import type { ShippingBillSummary } from '@/services/api-types'
import { queryKeys } from '@/services/query-keys'
import { getShippingBillFlatFile, listShippingBills } from '@/services/shipping-bill-service'
import { downloadTextFile } from '@/shared/download-file'
import { routes } from '@/shared/route-paths'
import { formatAmount } from '@/shipping-bills/model/calculations'
import { useMutation, useQuery } from 'core/react-query'
import { navigate } from 'core/routing'
import { toast } from 'core/toast-manager'
import { useState } from 'react'
import { Badge } from 'ui/basic/badge'
import { Button } from 'ui/basic/button'
import { Card, CardContent } from 'ui/basic/card'
import { Table } from 'ui/basic/table'
import { Input } from 'ui/inputs/input'
import { AlertDanger } from 'ui/notify/alert'
import { Spinner } from 'ui/notify/spinner'

function matchesSearch(bill: ShippingBillSummary, search: string) {
  const haystack = [bill.id, bill.jobNumber, bill.exporterName, bill.consigneeName, ...bill.invoiceNumbers]
  return haystack.join(' ').toLowerCase().includes(search.trim().toLowerCase())
}

export default function ListDashboard() {
  const bills = useQuery({ queryKey: queryKeys.bills, queryFn: listShippingBills })
  const [search, setSearch] = useState('')
  const all = bills.data ?? []
  const filtered = all.filter((bill) => matchesSearch(bill, search))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950">Shipping bills</h1>
          <p className="mt-1 text-sm text-gray-500">Create and continue the shipping bill step of each export job.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" loading={bills.isFetching} onClick={() => bills.refetch()}>
            Refresh
          </Button>
          <Button onClick={() => navigate(routes.shippingBillNew)}>+ New shipping bill</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Shipping bills" value={all.length} />
        <StatCard label="Exporters" value={new Set(all.map((bill) => bill.exporterName).filter(Boolean)).size} />
        <StatCard label="Consignees" value={new Set(all.map((bill) => bill.consigneeName).filter(Boolean)).size} />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Input
              label="Search bills"
              wrapClass="w-full max-w-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Job, invoice, exporter or consignee"
            />
            {bills.isSuccess && (
              <span className="text-sm text-gray-500">
                {filtered.length} {filtered.length === 1 ? 'bill' : 'bills'}
              </span>
            )}
          </div>
          {bills.isPending ? (
            <div className="flex justify-center p-10">
              <Spinner />
            </div>
          ) : bills.isError ? (
            <div className="space-y-3">
              <AlertDanger title="Could not load shipping bills" description="Check your connection and try again." />
              <Button variant="outline" size="sm" onClick={() => bills.refetch()}>
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState searching={search.trim() !== ''} />
          ) : (
            <BillsTable bills={filtered} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

function BillsTable({ bills }: { bills: ShippingBillSummary[] }) {
  const flatFile = useMutation({
    mutationFn: getShippingBillFlatFile,
    onSuccess: (file) => {
      downloadTextFile(file.filename, file.content)
      toast.success(`Downloaded ${file.filename}`)
    }
  })

  return (
    <Table>
      <thead>
        <tr>
          <th>Job</th>
          <th>Exporter → Consignee</th>
          <th>Route</th>
          <th>Invoices</th>
          <th>Status</th>
          <th>Updated</th>
          <th className="text-right">Action</th>
        </tr>
      </thead>
      <tbody>
        {bills.map((bill) => (
          <tr key={bill.id}>
            <td className="font-medium">
              {bill.jobNumber ? `#${bill.jobNumber}` : `Bill #${bill.id}`}
              <span className="block text-xs font-normal text-gray-500">{bill.jobDate}</span>
            </td>
            <td>
              {bill.exporterName || '—'}
              <span className="block text-xs text-gray-500">to {bill.consigneeName || '—'}</span>
            </td>
            <td>
              {bill.loadingPort || '—'} → {bill.destinationPort || '—'}
            </td>
            <td>
              {bill.invoiceNumbers.length}
              <span className="block text-xs text-gray-500">{formatAmount(bill.totalValue, bill.currency)}</span>
            </td>
            <td>
              <Badge variant={bill.status === 'complete' ? 'success' : 'secondary'}>
                {bill.status === 'complete' ? 'Complete' : 'Draft'}
              </Badge>
            </td>
            <td>{new Date(bill.updated).toLocaleDateString()}</td>
            <td className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  loading={flatFile.isPending && flatFile.variables === bill.id}
                  onClick={() => flatFile.mutate(bill.id)}>
                  Flat file
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(routes.toShippingBillEdit(bill.id))}>
                  Open
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

function EmptyState({ searching }: { searching: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
      <p className="font-medium">{searching ? 'No matching shipping bills' : 'No shipping bills yet'}</p>
      <p className="mt-1 text-sm text-gray-500">
        {searching ? 'Try another job number or party name.' : 'Create a bill to start an export job.'}
      </p>
      {!searching && (
        <Button className="mt-4" onClick={() => navigate(routes.shippingBillNew)}>
          Create shipping bill
        </Button>
      )}
    </div>
  )
}
