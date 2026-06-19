import type { StockInfo } from '../types'

export type UsQuotesFile = {
  updatedAt: string
  tradeDate: string
  source: string
  currency: 'USD'
  quotes: Record<string, { close: number; tradeDate: string }>
}

export type UsOhlcvFile = {
  symbol: string
  currency: 'USD'
  closes: Record<string, number>
}

let usQuotesCache: UsQuotesFile | null = null
let usQuotesLoadedAt = 0

const QUOTES_TTL_MS = 60_000

function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}

export function normalizeUsSymbol(input: string): string | null {
  const symbol = input.trim().toUpperCase()
  if (/^[A-Z][A-Z0-9.\-]{0,9}$/.test(symbol)) return symbol
  return null
}

export function resolveUsStock(input: string, popular: StockInfo[]): StockInfo | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const direct = normalizeUsSymbol(trimmed)
  if (direct) {
    const hit = popular.find((s) => s.code === direct)
    return hit ?? { name: direct, code: direct, market: 'US' }
  }

  const lower = trimmed.toLowerCase()
  const exact = popular.find((s) => s.name.toLowerCase() === lower)
  if (exact) return exact

  const partial = popular.filter(
    (s) => s.name.toLowerCase().includes(lower) || s.code.toLowerCase().includes(lower),
  )[0]
  return partial ?? null
}

export async function loadUsQuotes(force = false): Promise<UsQuotesFile> {
  const stale = Date.now() - usQuotesLoadedAt > QUOTES_TTL_MS
  if (!force && usQuotesCache && !stale) return usQuotesCache

  const res = await fetch(assetUrl(`us-quotes.json?t=${Date.now()}`), { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('US 시세(us-quotes.json)를 불러올 수 없습니다. Fetch US OHLCV 워크플로를 먼저 실행해 주세요.')
  }
  usQuotesCache = (await res.json()) as UsQuotesFile
  usQuotesLoadedAt = Date.now()
  return usQuotesCache
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function walkBackForClose(closes: Record<string, number>, dateStr: string, maxDays = 10): number | null {
  const [y, m, day] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, day)
  for (let i = 0; i < maxDays; i++) {
    const key = formatDate(date)
    const close = closes[key]
    if (close != null) return close
    date.setDate(date.getDate() - 1)
  }
  return null
}

export async function fetchUsCloseOnDate(symbol: string, dateStr: string): Promise<number> {
  const res = await fetch(assetUrl(`us-ohlcv/${symbol}.json?t=${Date.now()}`), { cache: 'no-store' })
  if (res.status === 404) {
    throw new Error(
      `${symbol} US 시세 이력이 없습니다. GitHub Actions → "Fetch US OHLCV (single symbol)" → symbol: ${symbol} 실행 후 1~2분 뒤 다시 시도해 주세요.`,
    )
  }
  if (!res.ok) throw new Error('US 기준일 종가를 불러올 수 없습니다.')

  const data = (await res.json()) as UsOhlcvFile
  const close = walkBackForClose(data.closes, dateStr)
  if (close == null) {
    throw new Error('해당 날짜의 US 종가를 찾을 수 없습니다. 기준일 또는 OHLCV 기간을 확인해 주세요.')
  }
  return close
}

export async function fetchUsCurrentPrice(symbol: string): Promise<number> {
  const quotes = await loadUsQuotes()
  const quote = quotes.quotes[symbol]
  if (!quote) {
    throw new Error(`${symbol} 현재가가 us-quotes.json에 없습니다. Fetch US OHLCV 워크플로를 실행해 주세요.`)
  }
  return quote.close
}
