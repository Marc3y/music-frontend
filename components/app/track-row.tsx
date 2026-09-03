'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
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
import { formatBytes, formatDate, formatTime } from '@/lib/format'
import { audioApi, ApiError } from '@/lib/api'
import { useT } from '@/lib/i18n/context'
import type { AudioFile } from '@/lib/types'

export function TrackRow({
  track,
  projectView,
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
  projectView?: boolean
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
  const t = useT()
  const isProject = track.kind === 'project'
  const isReady = track.status === 'ready'
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const displayCover = track.coverUrl || fallbackCoverUrl

  const selVersion = track.versions?.find((v) => v._id === track.selectedVersionId)
  // In der Projekt-Ansicht auch Audio-mit-Projekt als Projekt darstellen
  const showAsProject = isProject || (!!projectView && !!selVersion?.projectFilename)
  const shared = showAsProject ? track.projectShareEnabled : track.shareEnabled

  async function handleDelete() {
    try {
      await audioApi.remove(track._id)
      toast.success(isProject ? t('toast.projectDeleted') : t('toast.trackDeleted'))
      onDeleted(track._id)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('toast.deleteFailed'))
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
      {showAsProject ? (
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
          aria-label={isPlaying && isCurrent ? t('trackRow.pause') : t('trackRow.play')}
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
          {showAsProject
            ? selVersion?.projectFilename || t('trackRow.project')
            : track.artist || t('trackRow.unknownArtist')}
        </p>
      </div>

      <div className="hidden w-16 shrink-0 text-right text-xs text-muted-foreground lg:block">
        {showAsProject ? '' : track.bpm ? `${track.bpm} BPM` : '—'}
      </div>
      <div className="hidden w-12 shrink-0 text-right text-xs text-muted-foreground lg:block">
        {showAsProject ? '' : track.musicalKey || '—'}
      </div>

      <div className="hidden shrink-0 text-xs text-muted-foreground xl:block">
        {formatDate(track.createdAt)}
      </div>

      <div className="hidden shrink-0 text-xs text-muted-foreground sm:block">
        {showAsProject ? (
          selVersion?.projectSize ? formatBytes(selVersion.projectSize) : t('trackRow.project')
        ) : track.status === 'processing' ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="size-3 animate-spin" />
            {t('trackRow.processing')}
          </span>
        ) : track.status === 'failed' ? (
          <span className="text-destructive">{t('trackRow.failed')}</span>
        ) : (
          formatTime(track.duration)
        )}
      </div>

      {shared && (
        <span className="hidden shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary sm:inline-block">
          {t('trackRow.shared')}
        </span>
      )}

      <button
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={expanded ? t('trackRow.collapse') : t('trackRow.expand')}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronDown
          className={
            'size-4 transition-transform duration-200 ease-apple ' +
            (expanded ? 'rotate-180' : '')
          }
        />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground">
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="size-4" />
            {t('common.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onShare}>
            <Share2 className="size-4" />
            {t('common.share')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onVersions}>
            <Layers className="size-4" />
            {t('versions.titleTrack')}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            {t('common.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={isProject ? t('trackRow.deleteProjectTitle') : t('trackRow.deleteTrackTitle')}
        description={t('trackRow.deleteTrackBody', { title: track.title })}
        onConfirm={handleDelete}
      />
    </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-2">
              <TrackProjectPanel track={track} onUpdated={onUpdated} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
