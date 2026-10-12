'use client'

import Link from 'next/link'
import { Music, Pencil, Share2, Trash2, Users, X } from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { CoverImage } from '@/components/ui/cover-image'
import { useT } from '@/lib/i18n/context'
import type { Playlist } from '@/lib/types'

export function PlaylistCard({
  playlist,
  href,
  badge,
  collaboratorCount,
  onRemove,
  onEdit,
  onShare,
  onDelete,
}: {
  playlist: Pick<Playlist, '_id' | 'name' | 'coverUrl'>
  href?: string
  badge?: string
  collaboratorCount?: number
  onRemove?: () => void
  onEdit?: () => void
  onShare?: () => void
  onDelete?: () => void
}) {
  const t = useT()
  const hasMenu = Boolean(onEdit || onShare || onDelete)

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
          className="absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-md transition-opacity duration-150 hover:bg-black/70 focus-visible:opacity-100 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100"
        >
          <X className="size-4" />
        </button>
      )}
      <Link
        href={href ?? `/library/${playlist._id}`}
        className="flex flex-col gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted shadow-(--elevate-1) transition-[transform,box-shadow] duration-200 ease-out after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:ring-1 after:ring-foreground/8 after:ring-inset after:transition-colors after:duration-200 group-hover:shadow-(--elevate-2) group-hover:after:bg-foreground/5 group-active:scale-[0.98] group-active:duration-75">
          {playlist.coverUrl ? (
            <CoverImage
              src={playlist.coverUrl}
              alt=""
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Music className="size-9 text-muted-foreground/60" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[0.8125rem] leading-snug font-medium">{playlist.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[0.8125rem] leading-snug text-muted-foreground">
            {!!collaboratorCount && (
              <span
                title={t('library.hasCollaborators', { count: collaboratorCount })}
                className="inline-flex shrink-0"
              >
                <Users className="size-3" aria-hidden />
              </span>
            )}
            <span className="truncate">{badge ?? 'Playlist'}</span>
          </p>
        </div>
      </Link>
    </>
  )

  if (!hasMenu) {
    return (
      <div className="group relative">
        {card}
      </div>
    )
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger render={<div className="group relative" />}>
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
        {onDelete && (
          <ContextMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 />
            {t('common.delete')}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
