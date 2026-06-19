import type { StockInfo } from '../types'

export type QuotesFile = {
  updatedAt: string
  tradeDate: string
  source: string
  quotes: Record<string, { close: number; tradeDate: string }>
}

export type OhlcvFile = {
  code: string
  closes: Record<string, number>
}

let stockCache: StockInfo[] | null = null
let quotesCache: QuotesFile | null = null
let quotesLoadedAt = 0

const QUOTES_TTL_MS = 60_000

function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}

export async function loadStockList(): Promise<StockInfo[]> {
  if (stockCache) return stockCache
  const res = await fetch(assetUrl('stocks.json'))
  if (!res.ok) throw new Error('종목 목록을 불러올 수 없습니다.')
  stockCache = (await res.json()) as StockInfo[]
  return stockCache
}

export async function loadQuotes(force = false): Promise<QuotesFile> {
  const stale = Date.now() - quotesLoadedAt > QUOTES_TTL_MS
  if (!force && quotesCache && !stale) return quotesCache

  const res = await fetch(assetUrl('quotes.json'))
  if (!res.ok) {
    throw new Error('시세 데이터(quotes.json)를 불러올 수 없습니다. GitHub Actions 배포를 확인해 주세요.')
  }
  quotesCache = (await res.json()) as QuotesFile
  quotesLoadedAt = Date.now()
  return quotesCache
}

export function searchStocks(query: string, stocks: StockInfo[], limit = 8): StockInfo[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return stocks
    .filter(
      (s) => s.name.toLowerCase().includes(q) || s.code.includes(q) || s.market.toLowerCase().includes(q),
    )
    .slice(0, limit)
}

export function resolveStock(input: string, stocks: StockInfo[]): StockInfo | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const byCode = stocks.find((s) => s.code === trimmed)
  if (byCode) return byCode

  const lower = trimmed.toLowerCase()
  const exactName = stocks.find((s) => s.name.toLowerCase() === lower)
  if (exactName) return exactName

  return searchStocks(trimmed, stocks, 1)[0] ?? null
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

export async function fetchCloseOnDate(code: string, dateStr: string): Promise<number> {
  const res = await fetch(assetUrl(`ohlcv/${code}.json`))
  if (res.status === 404) {
    throw new Error(
      '종목 시세 이력(ohlcv)이 없습니다. GitHub Actions에서 "Backfill OHLCV" 워크플로를 실행해 주세요.',
    )
  }
  if (!res.ok) throw new Error('기준일 종가를 불러올 수 없습니다.')

  const data = (await res.json()) as OhlcvFile
  const close = walkBackForClose(data.closes, dateStr)
  if (close == null) {
    throw new Error('해당 날짜의 종가를 찾을 수 없습니다. OHLCV backfill 범위를 확인해 주세요.')
  }
  return close
}

export async function fetchCurrentPrice(code: string): Promise<number> {
  const quotes = await loadQuotes()
  const quote = quotes.quotes[code]
  if (!quote) throw new Error('현재가 데이터가 없습니다.')
  return quote.close
}

export async function fetchQuotesUpdatedAt(): Promise<string | null> {
  try {
    const quotes = await loadQuotes()
    return quotes.updatedAt
  } catch {
    return null
  }
}
