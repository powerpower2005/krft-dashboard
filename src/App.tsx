import { AddPositionForm } from './components/AddPositionForm'
import { PositionTable } from './components/PositionTable'
import { usePricePolling } from './hooks/usePricePolling'
import { usePositions } from './hooks/usePositions'
import './App.css'

import type { MarketRegion } from './types'

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
    reloadSeed,
    seedLoading,
  } = usePositions()

  usePricePolling(refreshReturns, positions.length > 0)

  const handleAdd = async (region: MarketRegion, nickname: string, stock: string, entryDate: string) => {
    try {
      await addPosition(region, nickname, stock, entryDate)
    } catch {
      // error state set in hook
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <h1>KRFT Dashboard</h1>
        <p>한국·미국 종목 기준일 종가 대비 수익률을 비교합니다.</p>
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
        loading={loading || seedLoading}
        lastUpdated={lastUpdated}
        onRemove={removePosition}
        onRefresh={() => void refreshReturns()}
        onReloadSeed={() => void reloadSeed()}
        seedLoading={seedLoading}
      />

      <footer className="footer muted">
        KR: pykrx/FDR · US: FDR (GitHub Actions) · 미국 종목은 Fetch US OHLCV 후 추가 · localStorage
      </footer>
    </div>
  )
}

export default App
