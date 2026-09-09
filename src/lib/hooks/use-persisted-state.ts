// lib/hooks/use-persisted-state.ts
'use client'

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

export function usePersistedState<T>(
  key: string,
  initial: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) setValue(JSON.parse(stored) as T)
    } catch {
      // malformed or blocked storage — fall back to initial
    }
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage unavailable (e.g. private mode) — selection just won't persist
    }
  }, [key, value, hydrated])

  return [value, setValue]
}