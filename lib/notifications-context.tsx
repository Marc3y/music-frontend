'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { API_URL, accountApi, notificationsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import type { AppNotification } from '@/lib/types'

interface NotificationsContextValue {
  items: AppNotification[]
  unreadCount: number
  loading: boolean
  hasMore: boolean
  loadMore: () => void
  markAllRead: () => void
  refresh: () => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const esRef = useRef<EventSource | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    notificationsApi
      .list()
      .then((page) => {
        setItems(page.notifications)
        setUnreadCount(page.unreadCount)
        setCursor(page.nextCursor)
        setHasMore(!!page.nextCursor)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const loadMore = useCallback(() => {
    if (!cursor || loading) return
    setLoading(true)
    notificationsApi
      .list(cursor)
      .then((page) => {
        setItems((prev) => [...prev, ...page.notifications])
        setCursor(page.nextCursor)
        setHasMore(!!page.nextCursor)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [cursor, loading])

  const markAllRead = useCallback(() => {
    setUnreadCount(0)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    notificationsApi.markRead().catch(() => {})
  }, [])

  // Load + live stream while authenticated.
  useEffect(() => {
    if (!user) {
      setItems([])
      setUnreadCount(0)
      return
    }

    refresh()

    let closed = false

    const connect = () => {
      if (closed) return
      const es = new EventSource(`${API_URL}/notifications/stream`, {
        withCredentials: true,
      })
      esRef.current = es

      es.addEventListener('notification', (e) => {
        try {
          const n = JSON.parse((e as MessageEvent).data) as AppNotification
          setItems((prev) =>
            prev.some((p) => p.id === n.id) ? prev : [n, ...prev],
          )
          if (!n.read) setUnreadCount((c) => c + 1)
        } catch {
          /* ignore */
        }
      })

      es.onerror = () => {
        es.close()
        esRef.current = null
        if (closed) return
        // The access cookie may have expired — a normal authed call refreshes it.
        accountApi
          .me()
          .catch(() => {})
          .finally(() => {
            if (closed) return
            reconnectRef.current = setTimeout(connect, 4000)
          })
      }
    }

    connect()

    return () => {
      closed = true
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      esRef.current?.close()
      esRef.current = null
    }
  }, [user, refresh])

  return (
    <NotificationsContext.Provider
      value={{ items, unreadCount, loading, hasMore, loadMore, markAllRead, refresh }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
