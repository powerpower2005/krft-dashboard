export type MarketRegion = 'KR' | 'US'

export type StockInfo = {
  name: string
  code: string
  market: string
}

export type Position = {
  id: string
  nickname: string
  region: MarketRegion
  stockName: string
  stockCode: string
  entryDate: string
  entryPrice: number
  currency: 'KRW' | 'USD'
}

export type PositionWithReturns = Position & {
  currentPrice: number | null
  returnPct: number | null
  quotesTradeDate?: string | null
  error?: string
}

export const POLL_INTERVAL_MS = 10 * 60 * 1000

export const US_POPULAR: StockInfo[] = [
  { name: 'VanEck Semiconductor ETF', code: 'SMH', market: 'US-ETF' },
  { name: 'Global X Data Center & Digital Infrastructure ETF', code: 'DTCR', market: 'US-ETF' },
  { name: 'VanEck Uranium and Nuclear ETF', code: 'NLR', market: 'US-ETF' },
  { name: 'First Trust NASDAQ Cybersecurity ETF', code: 'CIBR', market: 'US-ETF' },
  { name: 'Vanguard Energy ETF', code: 'VDE', market: 'US-ETF' },
  { name: 'iShares Biotechnology ETF', code: 'IBB', market: 'US-ETF' },
  { name: 'Fidelity Wise Origin Bitcoin Fund', code: 'FBTC', market: 'US-ETF' },
  { name: 'iShares U.S. Medical Devices ETF', code: 'IHI', market: 'US-ETF' },
  { name: 'SPDR S&P 500 ETF', code: 'SPY', market: 'US-ETF' },
  { name: 'Invesco QQQ Trust', code: 'QQQ', market: 'US-ETF' },
  { name: 'Apple Inc.', code: 'AAPL', market: 'US' },
  { name: 'NVIDIA Corporation', code: 'NVDA', market: 'US' },
  { name: 'Microsoft Corporation', code: 'MSFT', market: 'US' },
  { name: 'Amazon.com Inc.', code: 'AMZN', market: 'US' },
  { name: 'Meta Platforms Inc.', code: 'META', market: 'US' },
  { name: 'Alphabet Inc. Class A', code: 'GOOGL', market: 'US' },
  { name: 'Tesla Inc.', code: 'TSLA', market: 'US' },
]
