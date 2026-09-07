'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { isBackground, type Background } from '@/lib/background-presets'

const STORAGE_KEY = 'music.bg'
const DEFAULT: Background = 'aurora'

interface BackgroundContextValue {
  background: Background
  setBackground: (b: Background) => void
}

const BackgroundContext = createContext<BackgroundContextValue | null>(null)

function apply(bg: Background) {
  const root = document.documentElement
  if (bg === DEFAULT) root.removeAttribute('data-bg')
  else root.setAttribute('data-bg', bg)
}

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [background, setBgState] = useState<Background>(DEFAULT)

  useEffect(() => {
    let stored: Background = DEFAULT
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (isBackground(raw)) stored = raw
    } catch {
      /* ignore */
    }
    setBgState(stored)
    apply(stored)
  }, [])

  const setBackground = useCallback((next: Background) => {
    setBgState(next)
    apply(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <BackgroundContext.Provider value={{ background, setBackground }}>
      {children}
    </BackgroundContext.Provider>
  )
}

export function useBackground() {
  const ctx = useContext(BackgroundContext)
  if (!ctx) throw new Error('useBackground must be used within BackgroundProvider')
  return ctx
}
