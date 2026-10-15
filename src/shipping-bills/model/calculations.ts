// Pure domain rules. No React, no I/O: easy to unit test and shared by the form, the payload mapper and the mock server.
import { BillInvoiceForm, BillItemForm } from './types'

export function isBlank(value: string | undefined | null) {
  return value == null || value.trim() === ''
}

/** Form values use '' for "not entered", so a blank value falls back to the default. */
export function valueOr(value: string | undefined, fallback: string) {
  return isBlank(value) ? fallback : value!
}

/** Parses an optional numeric form value; blank → undefined. */
export function toOptionalNumber(value: string | undefined) {
  return isBlank(value) ? undefined : Number(value)
}

export function lineTotal(item: Pick<BillItemForm, 'quantity' | 'unitPrice' | 'lineTotal'>) {
  if (!isBlank(item.lineTotal)) return Number(item.lineTotal)
  const total = Number(item.quantity) * Number(item.unitPrice)
  return Number.isFinite(total) ? total : 0
}

export function itemsTotal(invoice: Pick<BillInvoiceForm, 'items'>) {
  return invoice.items.reduce((sum, item) => sum + lineTotal(item), 0)
}

/** The declared invoice total when entered, otherwise the sum of its items. */
export function invoiceTotal(invoice: Pick<BillInvoiceForm, 'items' | 'invoiceTotal'>) {
  return isBlank(invoice.invoiceTotal) ? itemsTotal(invoice) : Number(invoice.invoiceTotal)
}

export function formatAmount(value: number, currency?: string) {
  const amount = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return currency ? `${currency} ${amount}` : amount
}

/** UN/LOCODE and Indian customs port codes start with the ISO country code (INNSA1 → IN, USLAX → US). */
export function portCountry(portCode: string | undefined) {
  return portCode?.slice(0, 2).toUpperCase() ?? ''
}

export interface PriceComponents {
  freight: boolean
  insurance: boolean
}

// Customs value is assessed on FOB. When the invoice price also includes freight and/or insurance,
// those amounts must be declared so they can be deducted.
const priceComponentsByContract: Record<string, PriceComponents> = {
  FOB: { freight: false, insurance: false },
  CF: { freight: true, insurance: false },
  CI: { freight: false, insurance: true },
  CIF: { freight: true, insurance: true }
}

export function priceComponents(contractType: string | undefined): PriceComponents {
  return priceComponentsByContract[contractType ?? ''] ?? { freight: false, insurance: false }
}

/** "Price includes" code (B/F/I/N) implied by the contract type; used when the user leaves it blank. */
export function impliedPriceInclusion(contractType: string | undefined) {
  const { freight, insurance } = priceComponents(contractType)
  if (freight && insurance) return 'B'
  if (freight) return 'F'
  if (insurance) return 'I'
  return 'N'
}

export const containerizedCargoCodes = ['C', 'CP']

// ISO 6346 letter values: A=10 … Z=38, skipping multiples of 11 (11, 22, 33).
const containerLetterValues = [
  10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 34, 35, 36, 37, 38
]

/** Validates format (4 letters + 7 digits) and the ISO 6346 check digit (last digit). */
export function isValidContainerNumber(containerNumber: string) {
  if (!/^[A-Z]{4}\d{7}$/.test(containerNumber)) return false
  let sum = 0
  for (let index = 0; index < 10; index++) {
    const char = containerNumber[index]
    const value = index < 4 ? containerLetterValues[char.charCodeAt(0) - 65] : Number(char)
    sum += value * 2 ** index
  }
  return (sum % 11) % 10 === Number(containerNumber[10])
}
