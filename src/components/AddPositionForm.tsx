import { useEffect, useRef, useState } from 'react'
import { loadStockList, searchStocks } from '../lib/stockApi'
import type { StockInfo } from '../types'

type Props = {
  onAdd: (nickname: string, stock: string, entryDate: string) => Promise<void>
  adding: boolean
}

export function AddPositionForm({ onAdd, adding }: Props) {
  const [nickname, setNickname] = useState('')
  const [stockInput, setStockInput] = useState('')
  const [entryDate, setEntryDate] = useState('')
  const [suggestions, setSuggestions] = useState<StockInfo[]>([])
  const [stocks, setStocks] = useState<StockInfo[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void loadStockList()
      .then(setStocks)
      .catch(() => setStocks([]))
  }, [])

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
    if (stocks.length > 0) {
      setSuggestions(searchStocks(value, stocks))
      setShowSuggestions(true)
    }
  }

  const pickSuggestion = (stock: StockInfo) => {
    setStockInput(stock.name)
    setShowSuggestions(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || !stockInput.trim() || !entryDate) return
    await onAdd(nickname, stockInput, entryDate)
    setNickname('')
    setStockInput('')
    setEntryDate('')
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form className="add-form card" onSubmit={handleSubmit}>
      <h2>종목 추가</h2>
      <div className="form-grid">
        <label>
          닉네임
          <input
            type="text"
            placeholder="예: 장기 삼성"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            maxLength={30}
          />
        </label>
        <div ref={wrapRef} className="stock-field">
          <label>
            종목명 / 코드
            <input
              type="text"
              placeholder="예: 삼성전자 또는 005930"
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
    </form>
  )
}
