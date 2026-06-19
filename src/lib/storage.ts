import type { Position } from '../types'

const STORAGE_KEY = 'krft-dashboard-positions'

function migratePosition(raw: Record<string, unknown>): Position {
  return {
    id: String(raw.id),
    nickname: String(raw.nickname),
    region: raw.region === 'US' ? 'US' : 'KR',
    stockName: String(raw.stockName),
    stockCode: String(raw.stockCode),
    entryDate: String(raw.entryDate),
    entryPrice: Number(raw.entryPrice),
    currency: raw.currency === 'USD' ? 'USD' : 'KRW',
  }
}

export function loadPositions(): Position[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Record<string, unknown>[]
    return parsed.map(migratePosition)
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
