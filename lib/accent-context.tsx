'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { isAccent, type Accent } from '@/lib/accent-presets'

const STORAGE_KEY = 'music.accent'
const DEFAULT_ACCENT: Accent = 'indigo'

interface AccentContextValue {
  accent: Accent
  setAccent: (a: Accent) => void
}

const AccentContext = createContext<AccentContextValue | null>(null)

function apply(accent: Accent) {
  const root = document.documentElement
  if (accent === DEFAULT_ACCENT) {
    root.removeAttribute('data-accent')
  } else {
    root.setAttribute('data-accent', accent)
  }
}

export function AccentProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<Accent>(DEFAULT_ACCENT)

  useEffect(() => {
    let stored: Accent = DEFAULT_ACCENT
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (isAccent(raw)) stored = raw
    } catch {
      /* ignore */
    }
    setAccentState(stored)
    apply(stored)
  }, [])

  const setAccent = useCallback((next: Accent) => {
    setAccentState(next)
    apply(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>{children}</AccentContext.Provider>
  )
}

export function useAccent() {
  const ctx = useContext(AccentContext)
  if (!ctx) throw new Error('useAccent must be used within AccentProvider')
  return ctx
}
