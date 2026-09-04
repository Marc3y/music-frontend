'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Music, Pencil, Share2, X } from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { liftHover } from '@/lib/motion'
import { useT } from '@/lib/i18n/context'
import type { Playlist } from '@/lib/types'

export function PlaylistCard({
  playlist,
  href,
  badge,
  onRemove,
  onEdit,
  onShare,
}: {
  playlist: Pick<Playlist, '_id' | 'name' | 'coverUrl'>
  href?: string
  badge?: string
  onRemove?: () => void
  onEdit?: () => void
  onShare?: () => void
}) {
  const t = useT()
  const hasMenu = Boolean(onEdit || onShare)

  const card = (
    <>
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove()
          }}
          aria-label={t('common.remove')}
          className="absolute top-1.5 right-1.5 z-10 flex size-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 backdrop-blur transition-opacity hover:text-destructive group-hover:opacity-100"
        >
          <X className="size-4" />
        </button>
      )}
      <Link
        href={href ?? `/library/${playlist._id}`}
        className="flex flex-col gap-3 rounded-2xl p-2 transition-colors hover:bg-card/60"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/25 to-accent/15 shadow-(--elevate-2) ring-1 ring-border/60 transition-all duration-300 group-hover:shadow-(--elevate-3) group-hover:ring-primary/30">
          {playlist.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={playlist.coverUrl || '/placeholder.svg'}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Music className="size-10 text-foreground/40" />
            </div>
          )}
        </div>
        <div className="min-w-0 px-1">
          <p className="truncate text-sm font-medium">{playlist.name}</p>
          <p className="text-xs text-muted-foreground">{badge ?? 'Playlist'}</p>
        </div>
      </Link>
    </>
  )

  if (!hasMenu) {
    return (
      <motion.div {...liftHover} className="group relative">
        {card}
      </motion.div>
    )
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger render={<motion.div {...liftHover} className="group relative" />}>
        {card}
      </ContextMenuTrigger>
      <ContextMenuContent>
        {onEdit && (
          <ContextMenuItem onClick={onEdit}>
            <Pencil />
            {t('common.edit')}
          </ContextMenuItem>
        )}
        {onShare && (
          <ContextMenuItem onClick={onShare}>
            <Share2 />
            {t('common.share')}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
