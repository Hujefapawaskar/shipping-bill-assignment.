// React-query bindings for the services, plus option sources for searchable selects.
// Components read data through these hooks/sources only, never from the services' internals.
import type { BusinessRole, PartyKind } from '@/services/api-types'
import { getBranch, getParty, searchBranches, searchBusinesses, searchExporters } from '@/services/party-service'
import { queryKeys } from '@/services/query-keys'
import {
  getMarksAndNumbers,
  getPort,
  getReferenceList,
  ReferenceListName,
  searchDocumentTypes,
  searchPorts
} from '@/services/reference-data-service'
import { QueryKey, useQuery } from 'core/react-query'

export interface SearchOption {
  value: string
  label: string
  hint?: string
}

/** Server-side searchable list of options, decoupled from where the data comes from. */
export interface OptionSource {
  /** Cache key prefix. Must differ between scopes (e.g. branches of different owners). */
  key: QueryKey
  search: (query: string) => Promise<SearchOption[]>
  /** Label of an already selected value, e.g. when a saved bill is opened. */
  getLabel: (value: string) => Promise<string>
}

export function useReferenceList<K extends ReferenceListName>(name: K) {
  return useQuery({ queryKey: queryKeys.referenceList(name), queryFn: () => getReferenceList(name) })
}

export function useMarksAndNumbers(exporterId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.marksAndNumbers(exporterId ?? ''),
    queryFn: () => getMarksAndNumbers(exporterId!),
    enabled: Boolean(exporterId)
  })
}

export const exporterSource: OptionSource = {
  key: [...queryKeys.parties, 'exporter'],
  async search(query) {
    const exporters = await searchExporters(query)
    return exporters.map((exporter) => ({
      value: String(exporter.id),
      label: exporter.name,
      hint: `IEC ${exporter.iec}`
    }))
  },
  async getLabel(id) {
    return (await getParty('exporter', Number(id))).name
  }
}

export function businessSource(role: BusinessRole): OptionSource {
  return {
    key: [...queryKeys.parties, 'business', role],
    async search(query) {
      const businesses = await searchBusinesses(role, query)
      return businesses.map((business) => ({ value: String(business.id), label: business.name }))
    },
    async getLabel(id) {
      return (await getParty('business', Number(id))).name
    }
  }
}

export function branchSource(kind: PartyKind, ownerId: number): OptionSource {
  return {
    key: [...queryKeys.parties, kind, ownerId, 'branches'],
    async search(query) {
      const branches = await searchBranches(kind, ownerId, query)
      return branches.map((branch) => ({
        value: String(branch.id),
        label: `${branch.branchName} · ${branch.city}`,
        hint: branch.address1
      }))
    },
    async getLabel(id) {
      const branch = await getBranch(kind, ownerId, Number(id))
      return `${branch.branchName} · ${branch.city}`
    }
  }
}

function portSource(scope: 'loading' | 'destination'): OptionSource {
  return {
    key: [...queryKeys.ports, scope],
    async search(query) {
      const ports = await searchPorts(scope, query)
      return ports.map((port) => ({ value: port.code, label: `${port.name} · ${port.code}`, hint: port.countryCode }))
    },
    async getLabel(code) {
      const port = await getPort(code)
      return `${port.name} · ${port.code}`
    }
  }
}

export const loadingPortSource = portSource('loading')
export const destinationPortSource = portSource('destination')

export const documentTypeSource: OptionSource = {
  key: queryKeys.documentTypes,
  search: searchDocumentTypes,
  async getLabel(code) {
    const matches = await searchDocumentTypes(code)
    return matches.find((option) => option.value === code)?.label ?? code
  }
}
