import { useEffect, useState } from 'react'

// Persist a piece of React state to localStorage, surviving page reloads.
// Reads are lazy (run once on mount) and writes are best-effort: storage being
// unavailable or full (private mode, quota) never throws — it just falls back to
// in-memory state for the session.
export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore write failures (storage disabled or over quota).
    }
  }, [key, value])

  return [value, setValue]
}
