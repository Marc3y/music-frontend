'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_LOCALE,
  isKnownLocale,
  localeList,
  messagesByLocale,
  type LocaleInfo,
} from './messages'

export const LOCALE_STORAGE_KEY = 'music.lang'
export const LOCALE_COOKIE = 'music.lang'

type Vars = Record<string, string | number>

function lookup(file: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part]
    return undefined
  }, file)
}

function interpolate(str: string, vars?: Vars): string {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`))
}

interface I18nValue {
  locale: string
  setLocale: (code: string) => void
  locales: LocaleInfo[]
  t: (key: string, vars?: Vars) => string
  mounted: boolean
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode
  initialLocale?: string
}) {
  const [locale, setLocaleState] = useState(
    isKnownLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE,
  )
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Reconcile with the client's stored choice (cookie is the source of truth
    // for SSR, but localStorage may be ahead on the very first switch).
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
      if (isKnownLocale(stored) && stored !== locale) setLocaleState(stored)
    } catch {
      /* ignore */
    }
    setMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((code: string) => {
    if (!isKnownLocale(code)) return
    setLocaleState(code)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, code)
    } catch {
      /* ignore */
    }
    document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`
  }, [])

  const t = useCallback(
    (key: string, vars?: Vars) => {
      const primary = lookup(messagesByLocale[locale], key)
      if (typeof primary === 'string') return interpolate(primary, vars)
      const fallback = lookup(messagesByLocale[DEFAULT_LOCALE], key)
      if (typeof fallback === 'string') return interpolate(fallback, vars)
      return key
    },
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, locales: localeList, t, mounted }),
    [locale, setLocale, t, mounted],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

/** Shorthand for components that only need the translate function. */
export function useT() {
  return useI18n().t
}
