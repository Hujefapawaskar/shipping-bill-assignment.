// Shipping bill persistence and export.
import { ShippingBillFormValues } from '@/shipping-bills/model/types'
import type { FlatFile, ShippingBill, ShippingBillSummary } from './api-types'
import { generateFlatFile } from './mock-server/flat-file'
import * as api from './mock-server/handlers'
import { mockRequest } from './mock-server/mock-request'
import { toShippingBillPayload } from './shipping-bill-payload'

export function listShippingBills(): Promise<ShippingBillSummary[]> {
  return mockRequest(() => api.listBills())
}

export function getShippingBill(id: number): Promise<ShippingBill> {
  return mockRequest(() => api.getBill(id))
}

/** Saves work in progress without validation ("Save & Next"). Creates the bill when `id` is undefined. */
export function saveShippingBillDraft(values: ShippingBillFormValues, id?: number): Promise<ShippingBill> {
  return mockRequest(() => api.saveBill(id, { values, status: 'draft' }))
}

/** Saves a validated bill together with the backend payload. Creates the bill when `id` is undefined. */
export function submitShippingBill(values: ShippingBillFormValues, id?: number): Promise<ShippingBill> {
  const payload = toShippingBillPayload(values)
  return mockRequest(() => api.saveBill(id, { values, status: 'complete', payload }))
}

export function getShippingBillFlatFile(id: number): Promise<FlatFile> {
  return mockRequest(() => generateFlatFile(api.getBill(id)))
}
