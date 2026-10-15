// Reference data (code lists, ports, shipping marks).
// To use a real backend, replace each `mockRequest(...)` body with an HTTP call from `core/request`;
// signatures and return types stay the same, so no UI change is needed.
import type { Option, Port } from './api-types'
import * as api from './mock-server/handlers'
import { mockRequest } from './mock-server/mock-request'

export type ReferenceLists = api.ReferenceLists
export type ReferenceListName = keyof ReferenceLists

export function getReferenceList<K extends ReferenceListName>(name: K): Promise<ReferenceLists[K]> {
  return mockRequest(() => api.referenceLists[name])
}

export function searchDocumentTypes(query: string): Promise<Option[]> {
  return mockRequest(() => api.searchDocumentTypes(query))
}

export function searchPorts(scope: 'loading' | 'destination', query: string): Promise<Port[]> {
  return mockRequest(() => api.searchPorts(scope, query))
}

export function getPort(code: string): Promise<Port> {
  return mockRequest(() => api.getPort(code))
}

export function getMarksAndNumbers(exporterId: string): Promise<string[]> {
  return mockRequest(() => api.getMarksAndNumbers(exporterId))
}
