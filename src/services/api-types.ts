// Data contracts between the UI and the (currently mocked) backend.
import { ShippingBillFormValues } from '@/shipping-bills/model/types'

export interface Option {
  value: string
  label: string
}

export interface SchemeOption extends Option {
  /** Scheme claims drawback / RoDTEP / RoSCTL, so drawback details are needed per item. */
  hasExportIncentive: boolean
}

export interface Port {
  code: string
  name: string
  countryCode: string
}

export interface Branch {
  id: number
  branchName: string
  address1: string
  address2?: string
  city: string
  state?: string
  pincode?: string
  countryCode: string
  email?: string
  mobile?: string
  gstnId?: string
  adCode?: string
  accountNo?: string
  ifscCode?: string
}

export interface Exporter {
  id: number
  name: string
  iec: string
  class: string
  type: string
  pan?: string
  tan?: string
  aeoNumber?: string
  website?: string
  notes?: string
  disabled?: boolean
  branches: Branch[]
}

export type BusinessRole = 'consignee' | 'buyer' | 'thirdParty'

export interface Business {
  id: number
  name: string
  iec?: string
  isConsignee: boolean
  isBuyer: boolean
  isNotify: boolean
  isThirdParty: boolean
  branches: Branch[]
}

export type PartyKind = 'exporter' | 'business'

export type NewBranch = Omit<Branch, 'id'>
export type NewExporter = Omit<Exporter, 'id' | 'branches' | 'disabled'> & { firstBranch: NewBranch }
export type NewBusiness = Omit<Business, 'id' | 'branches'> & { firstBranch: NewBranch }

/** draft: saved with "Save & Next", not validated. complete: passed validation on "Save changes". */
export type ShippingBillStatus = 'draft' | 'complete'

export interface ShippingBill {
  id: number
  status: ShippingBillStatus
  created: string
  updated: string
  values: ShippingBillFormValues
}

/** Row of the shipping bill list, denormalised by the server so the list needs a single request. */
export interface ShippingBillSummary {
  id: number
  status: ShippingBillStatus
  jobNumber: string
  jobDate: string
  exporterName: string
  consigneeName: string
  loadingPort: string
  destinationPort: string
  invoiceNumbers: string[]
  totalValue: number
  currency: string
  updated: string
}

export interface FlatFile {
  filename: string
  content: string
}
