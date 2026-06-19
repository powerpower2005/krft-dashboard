import { useCallback, useEffect, useState } from 'react'
import {
  fetchCloseOnDate,
  loadQuotes,
  loadStockList,
  resolveStock,
} from '../lib/stockApi'
import { createId, loadPositions, savePositions } from '../lib/storage'
import type { Position, PositionWithReturns } from '../types'

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
      const quotes = await loadQuotes(true)
      setQuotesTradeDate(quotes.tradeDate)

      const updated = positions.map((pos): PositionWithReturns => {
        const quote = quotes.quotes[pos.stockCode]
        if (!quote) {
          return {
            ...pos,
            currentPrice: null,
            returnPct: null,
            quotesTradeDate: quotes.tradeDate,
            error: '현재가 없음',
          }
        }

        const returnPct = ((quote.close - pos.entryPrice) / pos.entryPrice) * 100
        return {
          ...pos,
          currentPrice: quote.close,
          returnPct,
          quotesTradeDate: quotes.tradeDate,
        }
      })

      setReturns(updated)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : '시세 갱신에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [positions])

  const addPosition = async (nickname: string, stockInput: string, entryDate: string) => {
    setAdding(true)
    setError(null)
    try {
      const stocks = await loadStockList(true)
      const matched = resolveStock(stockInput, stocks)
      if (!matched) {
        throw new Error(
          `종목을 찾을 수 없습니다. (목록 ${stocks.length}개 로드됨) 코드 6자리(예: 456600)로 입력해 보세요.`,
        )
      }

      const entryPrice = await fetchCloseOnDate(matched.code, entryDate)

      const next: Position = {
        id: createId(),
        nickname: nickname.trim(),
        stockName: matched.name,
        stockCode: matched.code,
        entryDate,
        entryPrice,
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
