import { useEffect, useRef } from 'react'

export function useTabActive() {
  const tabActive = useRef(true)

  useEffect(() => {
    tabActive.current = !document.hidden
    const handler = () => { tabActive.current = !document.hidden }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return tabActive
}

export function useReducedMotion(): boolean {
  const reduced = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.current = mq.matches
    const handler = (e: MediaQueryListEvent) => { reduced.current = e.matches }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return reduced.current
}
