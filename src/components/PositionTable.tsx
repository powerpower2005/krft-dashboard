import { useMemo, useState } from 'react'
import type { PositionWithReturns } from '../types'

type Props = {
  rows: PositionWithReturns[]
  loading: boolean
  lastUpdated: Date | null
  onRemove: (id: string) => void
  onRefresh: () => void
  onReloadSeed: () => void
  seedLoading: boolean
}

function formatPrice(n: number | null, currency: 'KRW' | 'USD'): string {
  if (n == null) return '—'
  if (currency === 'USD') {
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${n.toLocaleString('ko-KR')}원`
}

function formatPct(n: number | null): string {
  if (n == null) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

function pctClass(n: number | null): string {
  if (n == null) return ''
  if (n > 0) return 'positive'
  if (n < 0) return 'negative'
  return ''
}

function compareReturn(a: PositionWithReturns, b: PositionWithReturns): number {
  const aPct = a.returnPct
  const bPct = b.returnPct
  if (aPct == null && bPct == null) return 0
  if (aPct == null) return 1
  if (bPct == null) return -1
  return bPct - aPct
}

export function PositionTable({
  rows,
  loading,
  lastUpdated,
  onRemove,
  onRefresh,
  onReloadSeed,
  seedLoading,
}: Props) {
  const [sortByReturn, setSortByReturn] = useState(false)

  const displayRows = useMemo(() => {
    if (!sortByReturn) return rows
    return [...rows].sort(compareReturn)
  }, [rows, sortByReturn])

  if (rows.length === 0) {
    return (
      <div className="card empty-state">
        <p>아직 등록된 종목이 없습니다.</p>
        <p className="muted">닉네임, 종목명, 기준일을 입력해 추가해 보세요.</p>
        <button type="button" className="btn-ghost" onClick={onReloadSeed} disabled={seedLoading}>
          {seedLoading ? '시드 불러오는 중…' : '시드 불러오기'}
        </button>
      </div>
    )
  }

  return (
    <div className="card table-wrap">
      <div className="table-header">
        <h2>수익률 비교</h2>
        <div className="table-actions">
          {lastUpdated && (
            <span className="muted">
              {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 조회 · 시세일{' '}
              {rows[0]?.quotesTradeDate ?? '—'} · 10분마다 quotes.json 재조회
            </span>
          )}
          <button
            type="button"
            className={`btn-ghost${sortByReturn ? ' active' : ''}`}
            onClick={() => setSortByReturn((v) => !v)}
            disabled={loading || seedLoading}
            aria-pressed={sortByReturn}
          >
            {sortByReturn ? '수익률순 ✓' : '수익률순'}
          </button>
          <button type="button" className="btn-ghost" onClick={onReloadSeed} disabled={seedLoading || loading}>
            {seedLoading ? '시드 적용 중…' : '시드 불러오기'}
          </button>
          <button type="button" className="btn-ghost" onClick={onRefresh} disabled={loading || seedLoading}>
            {loading ? '갱신 중…' : '지금 갱신'}
          </button>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>닉네임</th>
              <th>종목</th>
              <th>기준일</th>
              <th>기준가</th>
              <th>현재가</th>
              <th>수익률</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => (
              <tr key={row.id}>
                <td className="nickname">{row.nickname}</td>
                <td>
                  <div>{row.stockName}</div>
                  <div className="muted">
                    {row.region === 'US' ? 'US · ' : 'KR · '}
                    {row.stockCode}
                  </div>
                </td>
                <td>{row.entryDate}</td>
                <td>{formatPrice(row.entryPrice, row.currency)}</td>
                <td>{formatPrice(row.currentPrice, row.currency)}</td>
                <td className={pctClass(row.returnPct)}>
                  {row.error ? <span className="error-text">{row.error}</span> : formatPct(row.returnPct)}
                </td>
                <td>
                  <button type="button" className="btn-remove" onClick={() => onRemove(row.id)} aria-label="삭제">
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
