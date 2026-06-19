import type { PositionWithReturns } from '../types'

type Props = {
  rows: PositionWithReturns[]
  loading: boolean
  lastUpdated: Date | null
  onRemove: (id: string) => void
  onRefresh: () => void
}

function formatPrice(n: number | null): string {
  if (n == null) return '—'
  return n.toLocaleString('ko-KR') + '원'
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

export function PositionTable({ rows, loading, lastUpdated, onRemove, onRefresh }: Props) {
  if (rows.length === 0) {
    return (
      <div className="card empty-state">
        <p>아직 등록된 종목이 없습니다.</p>
        <p className="muted">닉네임, 종목명, 기준일을 입력해 추가해 보세요.</p>
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
          <button type="button" className="btn-ghost" onClick={onRefresh} disabled={loading}>
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
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="nickname">{row.nickname}</td>
                <td>
                  <div>{row.stockName}</div>
                  <div className="muted">{row.stockCode}</div>
                </td>
                <td>{row.entryDate}</td>
                <td>{formatPrice(row.entryPrice)}</td>
                <td>{formatPrice(row.currentPrice)}</td>
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
