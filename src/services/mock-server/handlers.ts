// Endpoint implementations of the mock backend. Each function corresponds to one HTTP endpoint
// (noted above it) and works synchronously on the in-memory tables; latency/failures/cloning are
// added by `mockRequest` in the service layer.
import { invoiceTotal, valueOr } from '@/shipping-bills/model/calculations'
import { ShippingBillFormValues } from '@/shipping-bills/model/types'
import type {
  Branch,
  Business,
  BusinessRole,
  Exporter,
  NewBranch,
  NewBusiness,
  NewExporter,
  Option,
  PartyKind,
  Port,
  SchemeOption,
  ShippingBill,
  ShippingBillStatus,
  ShippingBillSummary
} from '../api-types'
import type { ShippingBillPayload } from '../shipping-bill-payload'
import * as codeLists from './data/code-lists'
import { documentCodes } from './data/document-codes'
import { quantityCodes } from './data/quantity-codes'
import { schemeCodes } from './data/scheme-codes'
import { stateOptions } from './data/states'
import { tradeAgreements } from './data/trade-agreements'
import { db, StoredBill } from './database'
import { conflict, notFound } from './mock-request'

function matches(query: string, ...fields: (string | undefined)[]) {
  const term = query.trim().toLowerCase()
  return fields.some((value) => value?.toLowerCase().includes(term))
}

// ---- Reference data: GET /api/reference/:list ----

export const referenceLists = {
  currencies: codeLists.currencies,
  contractTypes: codeLists.contractTypes,
  sealTypes: codeLists.sealTypes,
  containerSealTypes: codeLists.containerSealTypes,
  containerSizes: codeLists.containerSizes,
  weightUnits: codeLists.weightUnits,
  paymentTypes: codeLists.paymentTypes,
  priceInclusionTypes: codeLists.priceInclusionTypes,
  cargoNatures: codeLists.cargoNatures,
  nfeiCategories: codeLists.nfeiCategories,
  igstPaymentStatuses: codeLists.igstPaymentStatuses,
  accessoryStatuses: codeLists.accessoryStatuses,
  goodsSources: codeLists.goodsSources,
  documentFileTypes: codeLists.documentFileTypes,
  countries: codeLists.countries,
  exporterClasses: codeLists.exporterClasses,
  exporterTypes: codeLists.exporterTypes,
  quantityUnits: quantityCodes as Option[],
  tradeAgreements: tradeAgreements.map((option) => ({ value: option.value, label: option.label.trim() })) as Option[],
  states: stateOptions.map((state) => ({ value: String(state.value), label: state.label })) as Option[],
  dischargePorts: codeLists.destinationPorts.map((port) => ({
    value: port.code,
    label: `${port.name} · ${port.code}`
  })),
  schemeCodes: schemeCodes.map((scheme): SchemeOption => ({
    value: scheme.value,
    label: scheme.label,
    hasExportIncentive: scheme.drawback || scheme.RODTEP || scheme.ROSCTL
  }))
}

export type ReferenceLists = typeof referenceLists

// GET /api/reference/document-types?search=
export function searchDocumentTypes(query: string): Option[] {
  return documentCodes.filter((doc) => matches(query, doc.value, doc.label))
}

// GET /api/ports?scope=loading|destination&search=
export function searchPorts(scope: 'loading' | 'destination', query: string): Port[] {
  const ports = scope === 'loading' ? codeLists.loadingPorts : codeLists.destinationPorts
  return ports.filter((port) => matches(query, port.code, port.name))
}

// GET /api/ports/:code
export function getPort(code: string): Port {
  return (
    [...codeLists.loadingPorts, ...codeLists.destinationPorts].find((port) => port.code === code) ?? notFound('Port')
  )
}

// GET /api/exporters/:id/marks
export function getMarksAndNumbers(exporterId: string): string[] {
  return codeLists.marksByExporter[exporterId] ?? []
}

// ---- Parties ----

function partiesOf(kind: PartyKind): readonly (Exporter | Business)[] {
  return kind === 'exporter' ? db.exporters : db.businesses
}

// GET /api/exporters?search=
export function searchExporters(query: string): Exporter[] {
  return db.exporters.filter((exporter) => !exporter.disabled && matches(query, exporter.name, exporter.iec))
}

const roleFlag: Record<BusinessRole, keyof Business> = {
  consignee: 'isConsignee',
  buyer: 'isBuyer',
  thirdParty: 'isThirdParty'
}

// GET /api/businesses?role=&search=
export function searchBusinesses(role: BusinessRole, query: string): Business[] {
  return db.businesses.filter((business) => business[roleFlag[role]] === true && matches(query, business.name))
}

// GET /api/exporters/:id  |  GET /api/businesses/:id
export function getParty(kind: PartyKind, id: number) {
  return partiesOf(kind).find((party) => party.id === id) ?? notFound(kind === 'exporter' ? 'Exporter' : 'Business')
}

// GET /api/{exporters|businesses}/:id/branches?search=
export function searchBranches(kind: PartyKind, ownerId: number, query: string): Branch[] {
  return getParty(kind, ownerId).branches.filter((branch) => matches(query, branch.branchName, branch.city))
}

// GET /api/{exporters|businesses}/:id/branches/:branchId
export function getBranch(kind: PartyKind, ownerId: number, branchId: number): Branch {
  return getParty(kind, ownerId).branches.find((branch) => branch.id === branchId) ?? notFound('Branch')
}

// POST /api/exporters
export function createExporter({ firstBranch, ...input }: NewExporter): Exporter {
  const id = db.nextId()
  const exporter: Exporter = { ...input, id, branches: [{ ...firstBranch, id: id + 1 }] }
  db.update(({ exporters }) => ({ exporters: [...exporters, exporter] }))
  return exporter
}

// POST /api/businesses
export function createBusiness({ firstBranch, ...input }: NewBusiness): Business {
  const id = db.nextId()
  const business: Business = { ...input, id, branches: [{ ...firstBranch, id: id + 1 }] }
  db.update(({ businesses }) => ({ businesses: [...businesses, business] }))
  return business
}

// POST /api/{exporters|businesses}/:id/branches
export function createBranch(kind: PartyKind, ownerId: number, input: NewBranch): Branch {
  getParty(kind, ownerId)
  const branch: Branch = { ...input, id: db.nextId() }
  function addBranch<P extends Exporter | Business>(parties: P[]) {
    return parties.map((party) => (party.id === ownerId ? { ...party, branches: [...party.branches, branch] } : party))
  }
  db.update((tables) =>
    kind === 'exporter' ? { exporters: addBranch(tables.exporters) } : { businesses: addBranch(tables.businesses) }
  )
  return branch
}

// ---- Shipping bills ----

function toSummary(bill: ShippingBill): ShippingBillSummary {
  const { values } = bill
  return {
    id: bill.id,
    status: bill.status,
    jobNumber: values.jobNumber ?? '',
    jobDate: values.jobDate,
    exporterName: db.exporters.find((party) => String(party.id) === values.exporterId)?.name ?? '',
    consigneeName: db.businesses.find((party) => String(party.id) === values.consigneeId)?.name ?? '',
    loadingPort: values.loadingPort,
    destinationPort: values.finalDestinationPort,
    invoiceNumbers: values.invoices.map((invoice) => invoice.invoiceNumber).filter(Boolean),
    totalValue: values.invoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0),
    currency: values.invoices[0]?.currency ?? '',
    updated: bill.updated
  }
}

// GET /api/shipping-bills
export function listBills(): ShippingBillSummary[] {
  return [...db.bills].sort((a, b) => b.updated.localeCompare(a.updated)).map(toSummary)
}

// GET /api/shipping-bills/:id
export function getBill(id: number): ShippingBill {
  return withoutPayload(findBill(id))
}

function findBill(id: number) {
  return db.bills.find((bill) => bill.id === id) ?? notFound('Shipping bill')
}

function nextJobNumber() {
  const numbers = db.bills.map((bill) => Number(bill.values.jobNumber)).filter(Number.isFinite)
  return String(Math.max(2080, ...numbers) + 1)
}

interface SaveBillRequest {
  values: ShippingBillFormValues
  status: ShippingBillStatus
  /** Present on final submission; this is what downstream filing would consume. */
  payload?: ShippingBillPayload
}

// POST /api/shipping-bills (id undefined)  |  PUT /api/shipping-bills/:id
export function saveBill(id: number | undefined, { values, status, payload }: SaveBillRequest): ShippingBill {
  const previous = id == null ? undefined : findBill(id)
  const jobNumber = valueOr(values.jobNumber?.trim(), previous?.values.jobNumber ?? nextJobNumber())
  const duplicate = db.bills.find((bill) => bill.id !== id && bill.values.jobNumber === jobNumber)
  if (duplicate)
    conflict(`Job number ${jobNumber} is already used`, `Shipping bill #${duplicate.id} has this job number.`)

  const now = new Date().toISOString()
  const bill: StoredBill = {
    id: previous?.id ?? db.nextId(),
    status,
    created: previous?.created ?? now,
    updated: now,
    values: { ...values, jobNumber },
    payload
  }
  db.update(({ bills }) => ({ bills: [bill, ...bills.filter((item) => item.id !== bill.id)] }))
  return withoutPayload(bill)
}

function withoutPayload({ payload: _, ...bill }: StoredBill): ShippingBill {
  return bill
}
