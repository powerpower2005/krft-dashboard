import { useCallback, useEffect, useState } from 'react'
import { fetchCloseOnDate, loadQuotes, loadStockList, resolveStock } from '../lib/stockApi'
import {
  fetchUsCloseOnDate,
  loadUsQuotes,
  resolveUsStock,
} from '../lib/usStockApi'
import { createId, loadPositions, savePositions } from '../lib/storage'
import type { MarketRegion, Position, PositionWithReturns } from '../types'
import { US_POPULAR } from '../types'

export function usePositions() {
  const [positions, setPositions] = useState<Position[]>(() => loadPositions())
  const [returns, setReturns] = useState<PositionWithReturns[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [quotesTradeDate, setQuotesTradeDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    savePositions(positions)
  }, [positions])

  const refreshReturns = useCallback(async () => {
    if (positions.length === 0) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const hasKr = positions.some((p) => p.region === 'KR')
      const hasUs = positions.some((p) => p.region === 'US')

      const [krQuotes, usQuotes] = await Promise.all([
        hasKr ? loadQuotes(true) : Promise.resolve(null),
        hasUs ? loadUsQuotes(true) : Promise.resolve(null),
      ])

      if (krQuotes) setQuotesTradeDate(krQuotes.tradeDate)

      const updated = await Promise.all(
        positions.map(async (pos): Promise<PositionWithReturns> => {
          try {
            if (pos.region === 'US') {
              const quote = usQuotes?.quotes[pos.stockCode]
              if (!quote) {
                return {
                  ...pos,
                  currentPrice: null,
                  returnPct: null,
                  quotesTradeDate: usQuotes?.tradeDate ?? null,
                  error: 'US 현재가 없음',
                }
              }
              const returnPct = ((quote.close - pos.entryPrice) / pos.entryPrice) * 100
              return { ...pos, currentPrice: quote.close, returnPct, quotesTradeDate: quote.tradeDate }
            }

            const quote = krQuotes?.quotes[pos.stockCode]
            if (!quote) {
              return { ...pos, currentPrice: null, returnPct: null, quotesTradeDate: krQuotes?.tradeDate ?? null, error: '현재가 없음' }
            }
            const returnPct = ((quote.close - pos.entryPrice) / pos.entryPrice) * 100
            return { ...pos, currentPrice: quote.close, returnPct, quotesTradeDate: krQuotes?.tradeDate ?? null }
          } catch (err) {
            return {
              ...pos,
              currentPrice: null,
              returnPct: null,
              error: err instanceof Error ? err.message : '갱신 실패',
            }
          }
        }),
      )

      setReturns(updated)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : '시세 갱신에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [positions])

  const addPosition = async (
    region: MarketRegion,
    nickname: string,
    stockInput: string,
    entryDate: string,
  ) => {
    setAdding(true)
    setError(null)
    try {
      if (region === 'US') {
        const matched = resolveUsStock(stockInput, US_POPULAR)
        if (!matched) {
          throw new Error('US 티커를 찾을 수 없습니다. 예: SMH, AAPL, SPY')
        }
        const entryPrice = await fetchUsCloseOnDate(matched.code, entryDate)
        const next: Position = {
          id: createId(),
          nickname: nickname.trim(),
          region: 'US',
          stockName: matched.name,
          stockCode: matched.code,
          entryDate,
          entryPrice,
          currency: 'USD',
        }
        setPositions((prev) => [...prev, next])
        return
      }

      const stocks = await loadStockList(true)
      const matched = resolveStock(stockInput, stocks)
      if (!matched) {
        throw new Error(
          `종목을 찾을 수 없습니다. (목록 ${stocks.length}개) 코드 예: 005930, 0080G0`,
        )
      }
      const entryPrice = await fetchCloseOnDate(matched.code, entryDate)
      const next: Position = {
        id: createId(),
        nickname: nickname.trim(),
        region: 'KR',
        stockName: matched.name,
        stockCode: matched.code,
        entryDate,
        entryPrice,
        currency: 'KRW',
      }
      setPositions((prev) => [...prev, next])
    } catch (err) {
      setError(err instanceof Error ? err.message : '종목 추가에 실패했습니다.')
      throw err
    } finally {
      setAdding(false)
    }
  }

  const removePosition = (id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id))
  }

  return {
    positions,
    returns: positions.length === 0 ? [] : returns,
    lastUpdated: positions.length === 0 ? null : lastUpdated,
    quotesTradeDate,
    loading: positions.length === 0 ? false : loading,
    adding,
    error,
    setError,
    addPosition,
    removePosition,
    refreshReturns,
  }
}
