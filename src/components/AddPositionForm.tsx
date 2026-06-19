import { useEffect, useRef, useState } from 'react'
import { loadStockList, searchStocks } from '../lib/stockApi'
import type { MarketRegion, StockInfo } from '../types'
import { US_POPULAR } from '../types'

type Props = {
  onAdd: (region: MarketRegion, nickname: string, stock: string, entryDate: string) => Promise<void>
  adding: boolean
}

function searchUs(query: string, limit = 8): StockInfo[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return US_POPULAR.filter(
    (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
  ).slice(0, limit)
}

export function AddPositionForm({ onAdd, adding }: Props) {
  const [region, setRegion] = useState<MarketRegion>('KR')
  const [nickname, setNickname] = useState('')
  const [stockInput, setStockInput] = useState('')
  const [entryDate, setEntryDate] = useState('')
  const [suggestions, setSuggestions] = useState<StockInfo[]>([])
  const [stocks, setStocks] = useState<StockInfo[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (region === 'KR') {
      void loadStockList(true)
        .then(setStocks)
        .catch(() => setStocks([]))
    }
  }, [region])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleStockChange = (value: string) => {
    setStockInput(value)
    if (region === 'KR' && stocks.length > 0) {
      setSuggestions(searchStocks(value, stocks))
      setShowSuggestions(true)
    } else if (region === 'US') {
      setSuggestions(searchUs(value))
      setShowSuggestions(true)
    }
  }

  const pickSuggestion = (stock: StockInfo) => {
    setStockInput(region === 'US' ? stock.code : stock.name)
    setShowSuggestions(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || !stockInput.trim() || !entryDate) return
    await onAdd(region, nickname, stockInput, entryDate)
    setNickname('')
    setStockInput('')
    setEntryDate('')
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form className="add-form card" onSubmit={handleSubmit}>
      <h2>종목 추가</h2>
      <div className="region-toggle">
        <button
          type="button"
          className={region === 'KR' ? 'active' : ''}
          onClick={() => {
            setRegion('KR')
            setStockInput('')
            setSuggestions([])
          }}
        >
          한국
        </button>
        <button
          type="button"
          className={region === 'US' ? 'active' : ''}
          onClick={() => {
            setRegion('US')
            setStockInput('')
            setSuggestions([])
          }}
        >
          미국
        </button>
      </div>
      <div className="form-grid">
        <label>
          닉네임
          <input
            type="text"
            placeholder="예: 장기 SMH"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            maxLength={30}
          />
        </label>
        <div ref={wrapRef} className="stock-field">
          <label>
            {region === 'KR' ? '종목명 / 코드' : '티커'}
            <input
              type="text"
              placeholder={region === 'KR' ? '예: 삼성전자, 005930, 0080G0' : '예: SMH, AAPL, SPY'}
              value={stockInput}
              onChange={(e) => handleStockChange(e.target.value)}
              onFocus={() => stockInput && setShowSuggestions(true)}
              required
              autoComplete="off"
            />
          </label>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="suggestions">
              {suggestions.map((s) => (
                <li key={s.code}>
                  <button type="button" onClick={() => pickSuggestion(s)}>
                    <span>{s.name}</span>
                    <span className="muted">{s.code}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <label>
          기준일 (종가)
          <input
            type="date"
            value={entryDate}
            max={today}
            onChange={(e) => setEntryDate(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn-primary" disabled={adding}>
          {adding ? '추가 중…' : '추가'}
        </button>
      </div>
      {region === 'US' && (
        <p className="muted form-hint">
          최초 추가 전 GitHub Actions → Fetch US OHLCV → symbol 입력(SMH 등) 필요. SMH는 배포에 포함됩니다.
        </p>
      )}
    </form>
  )
}
