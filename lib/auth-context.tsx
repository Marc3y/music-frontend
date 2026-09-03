'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { accountApi, authApi } from './api'
import { getSupabase, googleOAuthConfigured } from './supabase'
import type { User } from './types'

const STORAGE_KEY = 'music.user'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const setUser = useCallback((next: User | null) => {
    setUserState(next)
    if (typeof window === 'undefined') return
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else window.localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Restore session on mount: read cached user for an instant paint, then
  // validate the cookie against /account/me (which also triggers the refresh
  // flow) and refresh the cached profile (username, avatar).
  useEffect(() => {
    let cancelled = false
    const raw =
      typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null

    if (!raw) {
      setLoading(false)
      return
    }

    try {
      setUserState(JSON.parse(raw))
    } catch {
      // ignore malformed cache
    }

    accountApi
      .me()
      .then((fresh) => {
        if (cancelled) return
        setUserState(fresh)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
        }
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setUserState(null)
        if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password })
      setUser(res.user)
      return res.user
    },
    [setUser],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      if (googleOAuthConfigured) {
        try {
          await getSupabase().auth.signOut()
        } catch {
          /* ignore */
        }
      }
      setUser(null)
    }
  }, [setUser])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
