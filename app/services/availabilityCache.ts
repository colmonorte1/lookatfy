import type { DayAvailability } from './actions'

const cache = new Map<string, { ts: number; data: DayAvailability[] }>()
const TTL_MS = 10 * 60 * 1000

function key(expertId: string, year: number, month: number, duration: number) {
  return `${expertId}-${year}-${month}-${duration}`
}

export function getCachedAvailability(expertId: string, year: number, month: number, duration: number): DayAvailability[] | null {
  const k = key(expertId, year, month, duration)
  const hit = cache.get(k)
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.data
  return null
}

export function setCachedAvailability(expertId: string, year: number, month: number, duration: number, data: DayAvailability[]) {
  const k = key(expertId, year, month, duration)
  cache.set(k, { ts: Date.now(), data })
}
