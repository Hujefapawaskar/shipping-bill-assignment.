// In-memory tables of the mock backend, persisted to localStorage so data survives a reload.
// Only the mock-server handlers use this module; the UI never touches it.
import type { Business, Exporter, ShippingBill } from '../api-types'
import type { ShippingBillPayload } from '../shipping-bill-payload'
import { seedBills, seedBusinesses, seedExporters } from './seed'

export interface StoredBill extends ShippingBill {
  payload?: ShippingBillPayload
}

interface Tables {
  exporters: Exporter[]
  businesses: Business[]
  bills: StoredBill[]
}

const storageKey = 'export-software-mock-db-v3'

function load(): Tables {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Tables>
      if (Array.isArray(parsed.exporters) && Array.isArray(parsed.businesses) && Array.isArray(parsed.bills)) {
        return parsed as Tables
      }
    }
  } catch {
    // Corrupt or unavailable storage: start from the seed data.
  }
  return { exporters: seedExporters, businesses: seedBusinesses, bills: seedBills }
}

const tables = load()

export const db = {
  get exporters(): readonly Exporter[] {
    return tables.exporters
  },
  get businesses(): readonly Business[] {
    return tables.businesses
  },
  get bills(): readonly StoredBill[] {
    return tables.bills
  },
  update(change: (current: Tables) => Partial<Tables>) {
    Object.assign(tables, change(tables))
    try {
      localStorage.setItem(storageKey, JSON.stringify(tables))
    } catch {
      // Storage disabled: the mock keeps working in memory.
    }
  },
  /** Single id sequence across tables, like a database sequence. */
  nextId() {
    const ids = [
      ...tables.exporters.flatMap((party) => [party.id, ...party.branches.map((branch) => branch.id)]),
      ...tables.businesses.flatMap((party) => [party.id, ...party.branches.map((branch) => branch.id)]),
      ...tables.bills.map((bill) => bill.id)
    ]
    return Math.max(3000, ...ids) + 1
  }
}
