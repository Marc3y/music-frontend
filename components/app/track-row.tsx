'use client'

import { useState } from 'react'
import { Loader2, MoreHorizontal, Music, Pause, Pencil, Play, Share2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDeleteDialog } from '@/components/app/confirm-delete-dialog'
import { formatTime } from '@/lib/format'
import { audioApi, ApiError } from '@/lib/api'
import type { AudioFile } from '@/lib/types'

export function TrackRow({
  track,
  isCurrent,
  isPlaying,
  isLoading,
  onPlay,
  onEdit,
  onShare,
  onDeleted,
}: {
  track: AudioFile
  isCurrent: boolean
  isPlaying: boolean
  isLoading: boolean
  onPlay: () => void
  onEdit: () => void
  onShare: () => void
  onDeleted: (id: string) => void
}) {
  const isReady = track.status === 'ready'
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleDelete() {
    try {
      await audioApi.remove(track._id)
      toast.success('Track gelöscht')
      onDeleted(track._id)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Löschen fehlgeschlagen')
    }
  }

  return (
    <div
      className={
        'group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-card/60 sm:gap-4 sm:px-3' +
        (isCurrent ? ' bg-card/60' : '')
      }
    >
      <button
        onClick={onPlay}
        disabled={!isReady}
        aria-label={isPlaying && isCurrent ? 'Pause' : 'Abspielen'}
        className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary/25 to-accent/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {track.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.coverUrl} alt="" className="size-full object-cover" />
        ) : (
          <Music className="size-4 text-foreground/40" />
        )}
        {isReady && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
            {isLoading && isCurrent ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isPlaying && isCurrent ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4 translate-x-px" />
            )}
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{track.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {track.artist || 'Unbekannter Interpret'}
        </p>
      </div>

      <div className="hidden shrink-0 text-xs text-muted-foreground sm:block">
        {track.status === 'processing' ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="size-3 animate-spin" />
            Wird verarbeitet
          </span>
        ) : track.status === 'failed' ? (
          <span className="text-destructive">Fehlgeschlagen</span>
        ) : (
          formatTime(track.duration)
        )}
      </div>

      {track.shareEnabled && (
        <span className="hidden shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary sm:inline-block">
          Geteilt
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground">
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="size-4" />
            Bearbeiten
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onShare}>
            <Share2 className="size-4" />
            Teilen
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Track löschen?"
        description={`"${track.title}" wird unwiderruflich gelöscht.`}
        onConfirm={handleDelete}
      />
    </div>
  )
}
