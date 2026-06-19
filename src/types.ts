export type StockInfo = {
  name: string
  code: string
  market: string
}

export type Position = {
  id: string
  nickname: string
  stockName: string
  stockCode: string
  entryDate: string
  entryPrice: number
}

export type PositionWithReturns = Position & {
  currentPrice: number | null
  returnPct: number | null
  quotesTradeDate?: string | null
  error?: string
}

export const POLL_INTERVAL_MS = 10 * 60 * 1000
