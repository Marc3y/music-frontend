'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { TrackRow } from '@/components/app/track-row'
import { VirtualizedTrackList } from '@/components/app/virtualized-track-list'
import { audioApi, ApiError } from '@/lib/api'
import { useT } from '@/lib/i18n/context'
import { ease } from '@/lib/motion'
import type { AudioFile } from '@/lib/types'

const LONG_PRESS_MS = 240
const MOVE_CANCEL_THRESHOLD = 6

const VIRTUALIZE_THRESHOLD = 80

export interface ReorderableTrackListHandle {

  scrollToTrack: (id: string) => void
}

interface Props {
  playlistId: string
  tracks: AudioFile[]
  projectView?: boolean
  fallbackCoverUrl?: string | null
  currentId: string | null
  highlightId?: string | null
  isPlaying: boolean
  isLoading: boolean
  onPlay: (track: AudioFile) => void
  onEdit: (track: AudioFile) => void
  onShare: (track: AudioFile) => void
  onVersions: (track: AudioFile) => void

  onUpdated: (track: AudioFile) => void
  onDeleted: (id: string) => void
  onChange: (tracks: AudioFile[]) => void
}

export const ReorderableTrackList = forwardRef<ReorderableTrackListHandle, Props>(
  function ReorderableTrackList(props, ref) {
    if (props.tracks.length > VIRTUALIZE_THRESHOLD) {
      return <VirtualizedTrackList ref={ref} {...props} />
    }
    return <PlainTrackList ref={ref} {...props} />
  },
)

const PlainTrackList = forwardRef<ReorderableTrackListHandle, Props>(function PlainTrackList(
  {
    playlistId,
    tracks,
    projectView,
    fallbackCoverUrl,
    currentId,
    highlightId,
    isPlaying,
    isLoading,
    onPlay,
    onEdit,
    onShare,
    onVersions,
    onUpdated,
    onDeleted,
    onChange,
  },
  ref,
) {
  const t = useT()
  const reduce = useReducedMotion()
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const tracksRef = useRef(tracks)
  tracksRef.current = tracks

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const activeId = useRef<string | null>(null)
  const changedDuringDrag = useRef(false)

  useImperativeHandle(
    ref,
    () => ({
      scrollToTrack(id: string) {
        document.getElementById(`track-${id}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      },
    }),
    [],
  )

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const persistOrder = useCallback(
    async (orderedIds: string[]) => {
      try {
        await audioApi.reorder(playlistId, orderedIds)
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : t('toast.reorderFailed'))
      }
    },
    [playlistId, t],
  )

  const handleMove = useCallback((clientY: number) => {
    const dragId = activeId.current
    if (!dragId) return
    const current = tracksRef.current
    const otherIds = current.filter((tr) => tr._id !== dragId).map((tr) => tr._id)

    let dropIndex = otherIds.length
    for (let i = 0; i < otherIds.length; i++) {
      const el = rowRefs.current.get(otherIds[i])
      if (!el) continue
      const rect = el.getBoundingClientRect()
      const mid = rect.top + rect.height / 2
      if (clientY < mid) {
        dropIndex = i
        break
      }
    }

    const newIds = [...otherIds]
    newIds.splice(dropIndex, 0, dragId)

    const currentIds = current.map((tr) => tr._id)
    if (newIds.join('|') !== currentIds.join('|')) {
      changedDuringDrag.current = true
      const byId = new Map(current.map((tr) => [tr._id, tr]))
      onChange(newIds.map((id) => byId.get(id)!))
    }
  }, [onChange])

  const endDrag = useCallback(() => {
    const wasDragging = activeId.current
    activeId.current = null
    setDraggingId(null)
    document.body.style.userSelect = ''
    if (wasDragging && changedDuringDrag.current) {
      void persistOrder(tracksRef.current.map((t) => t._id))
    }
    changedDuringDrag.current = false
  }, [persistOrder])

  useEffect(() => {
    if (!draggingId) return

    function onPointerMove(e: PointerEvent) {
      handleMove(e.clientY)
    }
    function onPointerUp() {
      endDrag()
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [draggingId, handleMove, endDrag])

  function onRowPointerDown(e: React.PointerEvent<HTMLDivElement>, trackId: string) {

    if ((e.target as HTMLElement).closest('button')) return
    if (e.pointerType === 'mouse' && e.button !== 0) return

    startPos.current = { x: e.clientX, y: e.clientY }
    clearLongPress()
    longPressTimer.current = setTimeout(() => {
      activeId.current = trackId
      changedDuringDrag.current = false
      setDraggingId(trackId)
      document.body.style.userSelect = 'none'
    }, LONG_PRESS_MS)
  }

  function onRowPointerMoveWhileArming(e: React.PointerEvent<HTMLDivElement>) {
    if (activeId.current) return
    if (!longPressTimer.current) return
    const dx = Math.abs(e.clientX - startPos.current.x)
    const dy = Math.abs(e.clientY - startPos.current.y)
    if (dx > MOVE_CANCEL_THRESHOLD || dy > MOVE_CANCEL_THRESHOLD) {
      clearLongPress()
    }
  }

  function onRowPointerUp() {
    clearLongPress()
  }

  const reordering = draggingId !== null

  return (
    <div className="-mx-2 flex flex-col gap-px sm:-mx-3">
      {tracks.map((track, index) => {
        const isDragging = draggingId === track._id
        return (
          <motion.div
            key={track._id}
            id={`track-${track._id}`}
            layout={reordering ? 'position' : false}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              isDragging || reordering
                ? { type: 'spring', stiffness: 500, damping: 40 }
                : { duration: 0.35, delay: Math.min(index, 14) * 0.035, ease: ease.out }
            }
            ref={(el) => {
              if (el) rowRefs.current.set(track._id, el)
              else rowRefs.current.delete(track._id)
            }}
            onPointerDown={(e) => onRowPointerDown(e, track._id)}
            onPointerMove={onRowPointerMoveWhileArming}
            onPointerUp={onRowPointerUp}
            onPointerLeave={onRowPointerUp}
            style={{
              touchAction: isDragging ? 'none' : undefined,
              position: 'relative',
            }}
            className={
              isDragging
                ? 'z-10 scale-[1.01] cursor-grabbing rounded-lg bg-popover shadow-(--elevate-3) ring-1 ring-border'
                : highlightId === track._id
                  ? 'cursor-default rounded-lg ring-2 ring-primary transition-shadow'
                  : 'cursor-default rounded-lg ring-0 transition-shadow'
            }
          >
            <div className="relative flex items-center">
              <div
                className={
                  isDragging
                    ? 'pointer-events-none absolute top-1/2 -left-5 hidden w-5 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors sm:flex'
                    : 'pointer-events-none absolute top-1/2 -left-5 hidden w-5 -translate-y-1/2 items-center justify-center text-transparent transition-colors sm:flex'
                }
              >
                <GripVertical className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <TrackRow
                  track={track}
                  projectView={projectView}
                  fallbackCoverUrl={fallbackCoverUrl}
                  isCurrent={currentId === track._id}
                  isPlaying={isPlaying && currentId === track._id}
                  isLoading={isLoading && currentId === track._id}
                  onPlay={onPlay}
                  onEdit={onEdit}
                  onShare={onShare}
                  onVersions={onVersions}
                  onUpdated={onUpdated}
                  onDeleted={onDeleted}
                />
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
})
