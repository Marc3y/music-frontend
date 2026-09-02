'use client'

import { useState } from 'react'
import { ChevronDown, FileArchive, Layers, Loader2, MoreHorizontal, Music, Pause, Pencil, Play, Share2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDeleteDialog } from '@/components/app/confirm-delete-dialog'
import { TrackProjectPanel } from '@/components/app/track-project-panel'
import { formatDate, formatTime } from '@/lib/format'
import { audioApi, ApiError } from '@/lib/api'
import type { AudioFile } from '@/lib/types'

export function TrackRow({
  track,
  fallbackCoverUrl,
  isCurrent,
  isPlaying,
  isLoading,
  onPlay,
  onEdit,
  onShare,
  onVersions,
  onUpdated,
  onDeleted,
}: {
  track: AudioFile
  fallbackCoverUrl?: string | null
  isCurrent: boolean
  isPlaying: boolean
  isLoading: boolean
  onPlay: () => void
  onEdit: () => void
  onShare: () => void
  onVersions: () => void
  onUpdated: (track: AudioFile) => void
  onDeleted: (id: string) => void
}) {
  const isProject = track.kind === 'project'
  const isReady = track.status === 'ready'
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const displayCover = track.coverUrl || fallbackCoverUrl
  const shared = isProject ? track.projectShareEnabled : track.shareEnabled

  async function handleDelete() {
    try {
      await audioApi.remove(track._id)
      toast.success(isProject ? 'Projekt gelöscht' : 'Track gelöscht')
      onDeleted(track._id)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Löschen fehlgeschlagen')
    }
  }

  return (
    <div className="flex flex-col">
    <div
      className={
        'group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-card/60 sm:gap-4 sm:px-3' +
        (isCurrent ? ' bg-card/60' : '')
      }
    >
      {isProject ? (
        <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary/25 to-accent/15">
          {displayCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayCover} alt="" className="size-full object-cover" />
          ) : (
            <FileArchive className="size-4 text-foreground/40" />
          )}
        </div>
      ) : (
        <button
          onClick={onPlay}
          disabled={!isReady}
          aria-label={isPlaying && isCurrent ? 'Pause' : 'Abspielen'}
          className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary/25 to-accent/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {displayCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayCover} alt="" className="size-full object-cover" />
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
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{track.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {isProject
            ? 'Projekt'
            : track.artist || 'Unbekannter Interpret'}
        </p>
      </div>

      <div className="hidden w-16 shrink-0 text-right text-xs text-muted-foreground lg:block">
        {isProject ? '' : track.bpm ? `${track.bpm} BPM` : '—'}
      </div>
      <div className="hidden w-12 shrink-0 text-right text-xs text-muted-foreground lg:block">
        {isProject ? '' : track.musicalKey || '—'}
      </div>

      <div className="hidden shrink-0 text-xs text-muted-foreground xl:block">
        {formatDate(track.createdAt)}
      </div>

      <div className="hidden shrink-0 text-xs text-muted-foreground sm:block">
        {isProject ? (
          'Projekt'
        ) : track.status === 'processing' ? (
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

      {shared && (
        <span className="hidden shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary sm:inline-block">
          Geteilt
        </span>
      )}

      <button
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Track einklappen' : 'Track aufklappen'}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronDown
          className={'size-4 transition-transform ' + (expanded ? 'rotate-180' : '')}
        />
      </button>

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
          <DropdownMenuItem onClick={onVersions}>
            <Layers className="size-4" />
            Versionen
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
        title={isProject ? 'Projekt löschen?' : 'Track löschen?'}
        description={`"${track.title}" wird mit allen Versionen unwiderruflich gelöscht.`}
        onConfirm={handleDelete}
      />
    </div>

      {expanded && (
        <div className="pb-2">
          <TrackProjectPanel track={track} onUpdated={onUpdated} />
        </div>
      )}
    </div>
  )
}
