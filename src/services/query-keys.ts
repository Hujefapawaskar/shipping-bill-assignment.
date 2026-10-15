// Central react-query cache keys, so invalidation after a write is consistent.
import type { ReferenceListName } from './reference-data-service'

export const queryKeys = {
  bills: ['shipping-bills'] as const,
  bill: (id: number) => ['shipping-bills', id] as const,
  parties: ['parties'] as const,
  referenceList: (name: ReferenceListName) => ['reference', name] as const,
  marksAndNumbers: (exporterId: string) => ['reference', 'marks-and-numbers', exporterId] as const,
  documentTypes: ['reference', 'document-types'] as const,
  ports: ['reference', 'ports'] as const
}
