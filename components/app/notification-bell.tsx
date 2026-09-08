'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Avatar } from '@base-ui/react/avatar'
import { Bell, Loader2, User } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotifications } from '@/lib/notifications-context'
import { useI18n } from '@/lib/i18n/context'
import { formatDateTime, formatMusicalKey, timeAgo } from '@/lib/format'
import { ease } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { AppNotification } from '@/lib/types'

// Playlist-level actions never deep-link to a track.
const PLAYLIST_LEVEL = new Set<AppNotification['type']>([
  'collab_renamed',
  'collab_cover',
  'collab_reordered',
  'collab_joined',
])

function notificationMessage(
  n: AppNotification,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const actor = n.actor.username
  const track = n.trackTitle ?? ''
  const playlist = n.playlistName ?? ''
  const from = n.meta?.from ?? ''
  const to = n.meta?.to ?? ''
  const field = n.meta?.field

  switch (n.type) {
    case 'listen':
      return t('notifications.listen', { actor, track })
    case 'share_saved':
      return n.meta?.savedKind === 'playlist'
        ? t('notifications.shareSavedPlaylist', { actor, playlist: playlist || track })
        : t('notifications.shareSavedTrack', { actor, track })
    case 'collab_renamed':
      return from
        ? t('notifications.renamedFromTo', { actor, from, to })
        : t('notifications.renamed', { actor, playlist })
    case 'collab_cover':
      return t('notifications.cover', { actor, playlist })
    case 'collab_track_added':
      return t('notifications.trackAdded', { actor, track, playlist })
    case 'collab_track_removed':
      return t('notifications.trackRemoved', { actor, track, playlist })
    case 'collab_track_cover':
      return t('notifications.trackCover', { actor, track })
    case 'collab_version_added':
      return t('notifications.versionAdded', { actor, track })
    case 'collab_version_removed':
      return t('notifications.versionRemoved', { actor, track })
    case 'collab_version_selected':
      return t('notifications.versionSelected', { actor, track })
    case 'collab_reordered':
      return t('notifications.reordered', { actor, playlist })
    case 'collab_joined':
      return t('notifications.joined', { actor, playlist })
    case 'collab_track_edited': {
      if (field === 'title')
        return t('notifications.titleChanged', { actor, from: from || track, to })
      if (field === 'artist')
        return to
          ? t('notifications.artistChanged', { actor, track, to })
          : t('notifications.artistCleared', { actor, track })
      if (field === 'description')
        return t('notifications.descChanged', { actor, track })
      if (field === 'bpm')
        return to
          ? t('notifications.bpmChanged', { actor, track, to })
          : t('notifications.bpmCleared', { actor, track })
      if (field === 'key')
        return to
          ? t('notifications.keyChanged', { actor, track, to: formatMusicalKey(to) })
          : t('notifications.keyCleared', { actor, track })
      if (field === 'label')
        return t('notifications.labelChanged', { actor, track, to })
      return t('notifications.trackEdited', { actor, track, playlist })
    }
    default:
      return t('notifications.trackEdited', { actor, track, playlist })
  }
}

function notificationHref(n: AppNotification): string | null {
  if (!n.playlistId) return null
  const anchor =
    n.trackId && !PLAYLIST_LEVEL.has(n.type)
      ? `?track=${encodeURIComponent(n.trackId)}`
      : ''
  return `/library/${n.playlistId}${anchor}`
}

function NotificationRow({
  n,
  locale,
  onNavigate,
}: {
  n: AppNotification
  locale: string
  onNavigate: (href: string) => void
}) {
  const { t } = useI18n()
  const message = notificationMessage(n, t)
  const href = notificationHref(n)

  const inner = (
    <>
      <Avatar.Root className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/30 to-accent/20 text-xs font-medium text-primary-foreground select-none">
        {n.actor.avatarUrl ? (
          <Avatar.Image src={n.actor.avatarUrl} alt="" className="size-full object-cover" />
        ) : null}
        <Avatar.Fallback className="flex size-full items-center justify-center uppercase">
          {n.actor.username.slice(0, 1) || <User className="size-3.5" />}
        </Avatar.Fallback>
      </Avatar.Root>

      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-foreground">{message}</p>
        {n.playlistName && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">
            {t('notifications.inPlaylist', { playlist: n.playlistName })}
          </p>
        )}
        <p
          className="mt-0.5 text-xs text-muted-foreground"
          title={formatDateTime(n.createdAt, locale)}
        >
          {timeAgo(n.createdAt, locale)}
        </p>
      </div>

      {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
    </>
  )

  const base = cn(
    'flex w-full gap-3 px-3 py-2.5 text-left transition-colors',
    !n.read && 'bg-primary/[0.05]',
  )

  if (href) {
    return (
      <button
        type="button"
        role="listitem"
        onClick={() => onNavigate(href)}
        className={cn(base, 'hover:bg-muted/50')}
      >
        {inner}
      </button>
    )
  }

  return (
    <div role="listitem" className={base}>
      {inner}
    </div>
  )
}

export function NotificationBell() {
  const { items, unreadCount, loading, hasMore, loadMore, markAllRead } = useNotifications()
  const { t, locale } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function navigate(href: string) {
    setOpen(false)
    if (unreadCount > 0) markAllRead()
    router.push(href)
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next && unreadCount > 0) {
      // give the badge a beat to animate out, then clear
      setTimeout(markAllRead, 1200)
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        aria-label={t('notifications.title')}
        className="relative inline-flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted/60 hover:text-foreground data-[popup-open]:bg-muted/60 data-[popup-open]:text-foreground"
      >
        <Bell className="size-4" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))]">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
          <p className="text-sm font-medium">{t('notifications.title')}</p>
          {items.some((n) => !n.read) && (
            <button
              onClick={markAllRead}
              className="text-xs font-medium text-primary hover:underline"
            >
              {t('notifications.markAllRead')}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="px-3 py-10 text-center text-sm text-muted-foreground">
            {loading ? (
              <Loader2 className="mx-auto size-4 animate-spin" />
            ) : (
              t('notifications.empty')
            )}
          </div>
        ) : (
          <>
            <div
              role="list"
              className="max-h-[min(26rem,60vh)] divide-y divide-border/50 overflow-y-auto"
            >
              {items.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={i < 12 ? { opacity: 0, y: 6 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: Math.min(i, 10) * 0.025, ease: ease.out }}
                >
                  <NotificationRow n={n} locale={locale} onNavigate={navigate} />
                </motion.div>
              ))}
            </div>
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="w-full border-t border-border/60 py-2.5 text-center text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="mx-auto size-3.5 animate-spin" />
                ) : (
                  t('notifications.loadMore')
                )}
              </button>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
