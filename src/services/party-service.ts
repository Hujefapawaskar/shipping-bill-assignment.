// Exporters, businesses (consignee / buyer / third party) and their branches.
import type {
  Branch,
  Business,
  BusinessRole,
  Exporter,
  NewBranch,
  NewBusiness,
  NewExporter,
  PartyKind
} from './api-types'
import * as api from './mock-server/handlers'
import { mockRequest } from './mock-server/mock-request'

export function searchExporters(query: string): Promise<Exporter[]> {
  return mockRequest(() => api.searchExporters(query))
}

export function searchBusinesses(role: BusinessRole, query: string): Promise<Business[]> {
  return mockRequest(() => api.searchBusinesses(role, query))
}

export function getParty(kind: PartyKind, id: number): Promise<Exporter | Business> {
  return mockRequest(() => api.getParty(kind, id))
}

export function searchBranches(kind: PartyKind, ownerId: number, query: string): Promise<Branch[]> {
  return mockRequest(() => api.searchBranches(kind, ownerId, query))
}

export function getBranch(kind: PartyKind, ownerId: number, branchId: number): Promise<Branch> {
  return mockRequest(() => api.getBranch(kind, ownerId, branchId))
}

export function createExporter(input: NewExporter): Promise<Exporter> {
  return mockRequest(() => api.createExporter(input))
}

export function createBusiness(input: NewBusiness): Promise<Business> {
  return mockRequest(() => api.createBusiness(input))
}

export function createBranch(kind: PartyKind, ownerId: number, input: NewBranch): Promise<Branch> {
  return mockRequest(() => api.createBranch(kind, ownerId, input))
}
