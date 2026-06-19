import { useEffect } from 'react'
import { POLL_INTERVAL_MS } from '../types'

export function usePricePolling(onPoll: () => void | Promise<void>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    void onPoll()

    const id = window.setInterval(() => {
      void onPoll()
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(id)
  }, [onPoll, enabled])
}
