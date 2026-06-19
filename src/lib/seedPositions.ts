import type { Position } from '../types'
import { createId } from './storage'

export type SeedPosition = Omit<Position, 'id'>

export type SeedFile = {
  version: number
  entryDate: string
  positions: SeedPosition[]
}

function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}

export async function fetchSeedFile(): Promise<SeedFile> {
  const res = await fetch(assetUrl(`seed-positions.json?t=${Date.now()}`), { cache: 'no-store' })
  if (!res.ok) throw new Error('시드 포지션을 불러올 수 없습니다.')
  const data = (await res.json()) as SeedFile
  if (!Array.isArray(data.positions) || data.positions.length === 0) {
    throw new Error('시드 포지션이 비어 있습니다.')
  }
  return data
}

export function seedToPositions(seed: SeedFile): Position[] {
  return seed.positions.map((p) => ({
    id: createId(),
    nickname: p.nickname,
    region: p.region === 'US' ? 'US' : 'KR',
    stockName: p.stockName,
    stockCode: p.stockCode,
    entryDate: p.entryDate,
    entryPrice: p.entryPrice,
    currency: p.currency === 'USD' ? 'USD' : 'KRW',
  }))
}
