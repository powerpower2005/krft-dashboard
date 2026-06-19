import { AddPositionForm } from './components/AddPositionForm'
import { PositionTable } from './components/PositionTable'
import { usePricePolling } from './hooks/usePricePolling'
import { usePositions } from './hooks/usePositions'
import './App.css'

function App() {
  const {
    positions,
    returns,
    lastUpdated,
    loading,
    adding,
    error,
    setError,
    addPosition,
    removePosition,
    refreshReturns,
  } = usePositions()

  usePricePolling(refreshReturns, positions.length > 0)

  const handleAdd = async (nickname: string, stock: string, entryDate: string) => {
    try {
      await addPosition(nickname, stock, entryDate)
    } catch {
      // error state set in hook
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <h1>KR Stock Compare</h1>
        <p>한국 종목 기준일 종가 대비 수익률을 비교합니다.</p>
      </header>

      {error && (
        <div className="alert" role="alert">
          {error}
          <button type="button" onClick={() => setError(null)} aria-label="닫기">
            ×
          </button>
        </div>
      )}

      <AddPositionForm onAdd={handleAdd} adding={adding} />
      <PositionTable
        rows={returns}
        loading={loading}
        lastUpdated={lastUpdated}
        onRemove={removePosition}
        onRefresh={() => void refreshReturns()}
      />

      <footer className="footer muted">
        데이터: pykrx / FinanceDataReader (GitHub Actions) · 시세 갱신: quotes.json · 브라우저 localStorage
      </footer>
    </div>
  )
}

export default App
