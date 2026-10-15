import { InternalError } from 'core/utils'

// Simulates the network boundary for the mock backend:
// - asynchronous with realistic latency, so loading states are visible
// - optional random failures, so error/retry states can be exercised
// - responses are deep-cloned, so callers can never mutate the "server" state by reference
//
// Failure injection (browser console):  localStorage.setItem('mock-api:failure-rate', '0.3'); then reload.
// Latency override:                      localStorage.setItem('mock-api:latency-ms', '1500'); then reload.

const latencyMs = readNumberSetting('mock-api:latency-ms', 350)
const failureRate = readNumberSetting('mock-api:failure-rate', 0)

export async function mockRequest<T>(handler: () => T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, latencyMs * (0.5 + Math.random())))
  if (Math.random() < failureRate) {
    throw new InternalError('Service temporarily unavailable', 503, 'Simulated network failure, please retry.')
  }
  return structuredClone(handler())
}

export function notFound(entity: string): never {
  throw new InternalError(`${entity} not found`, 404)
}

export function conflict(message: string, description?: string): never {
  throw new InternalError(message, 409, description)
}

function readNumberSetting(key: string, fallback: number) {
  try {
    const value = Number(localStorage.getItem(key) ?? fallback)
    return Number.isFinite(value) ? value : fallback
  } catch {
    return fallback
  }
}
