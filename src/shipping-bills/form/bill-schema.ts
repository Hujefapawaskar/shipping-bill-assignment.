import { isBlank, isValidContainerNumber } from '@/shipping-bills/model/calculations'
import { ShippingBillFormValues } from '@/shipping-bills/model/types'
import { s } from 'core/form'
import { getFormContext } from 'ui/form'

// fe-zen-arch looks rules up by the *last* path segment ("invoices.0.items.2.quantity" → "quantity"),
// so keys here are leaf field names and must stay unique in meaning across the bill.
// Rules that need sibling values in an array row are passed at the field instead (see invoice-charges / containers).
// Fields that are conditionally rendered (e.g. IGST amount) are only validated while they are on screen.

function positive(message: string) {
  return s.string().refine((value) => (Number(value) > 0 ? undefined : message))
}

function optionalNonNegative(message = 'Cannot be negative') {
  return s
    .string()
    .optional()
    .refine((value) => (isBlank(value) || Number(value) >= 0 ? undefined : message))
}

export const billSchema = s.object({
  // Details
  jobNumber: s.string().optional(),
  jobDate: s.string(),
  exporterId: s.string().requiredMsg('Select the exporter'),
  exporterBranchId: s.string().requiredMsg('Select the exporter branch'),
  consigneeId: s.string().requiredMsg('Select the consignee'),
  consigneeBranchId: s.string().requiredMsg('Select the consignee address'),
  loadingPort: s.string().requiredMsg('Select the port of loading'),
  finalDestinationPort: s.string().requiredMsg('Select the destination port'),
  grossWeight: optionalNonNegative(),
  netWeight: s
    .string()
    .optional()
    .refine((net, values: ShippingBillFormValues) => {
      if (isBlank(net)) return undefined
      if (Number(net) < 0) return 'Cannot be negative'
      if (!isBlank(values.grossWeight) && Number(net) > Number(values.grossWeight)) {
        return 'Net weight cannot exceed gross weight'
      }
      return undefined
    }),
  totalPackages: optionalNonNegative(),
  loosePackets: optionalNonNegative(),
  numberOfContainers: optionalNonNegative(),

  // Invoice
  invoiceNumber: s.string().requiredMsg('Enter the invoice number'),
  invoiceDate: s.string(),
  invoiceTotal: optionalNonNegative('Total cannot be negative'),
  periodOfPayment: optionalNonNegative(),
  packingCharges: optionalNonNegative(),

  // Item
  ritcCode: s.string().matches(/^\d{8}$/, 'RITC (HS) code must be 8 digits'),
  goodsDescription1: s.string().requiredMsg('Describe the goods'),
  quantity: positive('Enter a quantity above zero'),
  unitPrice: positive('Enter a price above zero'),
  lineTotal: optionalNonNegative(),
  taxableValue: positive('Required when IGST is paid'),
  igstAmount: s.string().requiredMsg('Required when IGST is paid'),
  drawbackSerialNumber: s.string().requiredMsg('Required for drawback / RoDTEP / RoSCTL schemes'),

  // Containers, packing, documents, licences
  containerNumber: s
    .string()
    .matches(/^[A-Z]{4}\d{7}$/, 'Use 4 letters + 7 digits, e.g. MSKU1234565')
    .refine((value) => (isValidContainerNumber(value) ? undefined : 'Check digit does not match')),
  packingNumberFrom: positive('Enter a package number'),
  documentTypeCode: s.string().requiredMsg('Select the document type'),
  registrationNumber: s.string().requiredMsg('Enter the licence registration number')
})

export function useBillForm() {
  return getFormContext<ShippingBillFormValues>().hooks
}
