import { useEffect, useRef } from 'react'

/**
 * Calls `callback` immediately is left to the caller (so the first load can
 * use a "loading" state instead of silently waiting for the first tick), then
 * re-invokes it every `intervalMs` while `enabled` is true. Pauses while the
 * tab is hidden to avoid burning cycles (and fake "network" calls) on
 * backgrounded tabs, and resumes - with an immediate refresh - when it
 * becomes visible again.
 */
export function usePolling(callback, intervalMs, enabled = true) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    let intervalId = null

    function start() {
      if (intervalId) return
      intervalId = setInterval(() => callbackRef.current(), intervalMs)
    }
    function stop() {
      if (intervalId) clearInterval(intervalId)
      intervalId = null
    }

    function handleVisibility() {
      if (document.hidden) {
        stop()
      } else {
        callbackRef.current()
        start()
      }
    }

    start()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [intervalMs, enabled])
}
