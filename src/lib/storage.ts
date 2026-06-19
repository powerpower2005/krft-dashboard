import type { Position } from '../types'

const STORAGE_KEY = 'krft-dashboard-positions'

export function loadPositions(): Position[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Position[]
  } catch {
    return []
  }
}

export function savePositions(positions: Position[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
}

export function createId(): string {
  return crypto.randomUUID()
}
