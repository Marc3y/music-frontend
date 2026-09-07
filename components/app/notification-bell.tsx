'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Avatar } from '@base-ui/react/avatar'
import { Bell, Loader2, User } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotifications } from '@/lib/notifications-context'
import { useI18n } from '@/lib/i18n/context'
import { formatDateTime, timeAgo } from '@/lib/format'
import { ease } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { AppNotification } from '@/lib/types'

const MESSAGE_KEY: Record<AppNotification['type'], string> = {
  listen: 'notifications.listen',
  collab_renamed: 'notifications.renamed',
  collab_cover: 'notifications.cover',
  collab_track_added: 'notifications.trackAdded',
  collab_track_removed: 'notifications.trackRemoved',
  collab_track_edited: 'notifications.trackEdited',
  collab_track_cover: 'notifications.trackCover',
  collab_version_added: 'notifications.versionAdded',
  collab_version_removed: 'notifications.versionRemoved',
  collab_version_selected: 'notifications.versionSelected',
  collab_reordered: 'notifications.reordered',
  collab_joined: 'notifications.joined',
}

function NotificationRow({ n, locale }: { n: AppNotification; locale: string }) {
  const { t } = useI18n()
  const message = t(MESSAGE_KEY[n.type], {
    actor: n.actor.username,
    track: n.trackTitle ?? '',
    playlist: n.playlistName ?? '',
  })

  return (
    <div
      role="listitem"
      className={cn(
        'flex gap-3 px-3 py-2.5 transition-colors',
        !n.read && 'bg-primary/[0.05]',
      )}
    >
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
        <p
          className="mt-0.5 text-xs text-muted-foreground"
          title={formatDateTime(n.createdAt, locale)}
        >
          {timeAgo(n.createdAt, locale)}
        </p>
      </div>

      {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
    </div>
  )
}

export function NotificationBell() {
  const { items, unreadCount, loading, hasMore, loadMore, markAllRead } = useNotifications()
  const { t, locale } = useI18n()
  const [open, setOpen] = useState(false)

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
                  <NotificationRow n={n} locale={locale} />
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
