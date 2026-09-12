'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { TrackRow } from '@/components/app/track-row'
import { audioApi, ApiError } from '@/lib/api'
import { useT } from '@/lib/i18n/context'
import type { AudioFile } from '@/lib/types'
import type { ReorderableTrackListHandle } from './reorderable-track-list'

const LONG_PRESS_MS = 240
const MOVE_CANCEL_THRESHOLD = 6
// Estimate only (44px cover + 2×8px padding + the 4px `gap-1` the
// non-virtualized list gets from flex): actual layout uses each row's
// measured height via `measureElement`.
const ROW_HEIGHT_ESTIMATE = 64

/**
 * Windowed sibling of `ReorderableTrackList`'s plain rendering path — kept as
 * a wholly separate component (not a branch inside one component) so that
 * `useWindowVirtualizer` — which attaches real `window` scroll/resize
 * listeners the moment it's called, whether or not anything uses its output —
 * is only ever invoked while this component is actually mounted, i.e. only
 * for lists over the virtualize threshold. Calling it unconditionally inside
 * one shared component was adding a permanent scroll listener + ResizeObserver
 * to every playlist page regardless of size, which is exactly the kind of
 * background main-thread cost this refactor exists to remove.
 */
export const VirtualizedTrackList = forwardRef<ReorderableTrackListHandle, {
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
}>(function VirtualizedTrackList(
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
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const tracksRef = useRef(tracks)
  tracksRef.current = tracks

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const activeId = useRef<string | null>(null)
  const changedDuringDrag = useRef(false)

  const listRef = useRef<HTMLDivElement>(null)

  const virtualizer = useWindowVirtualizer({
    count: tracks.length,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: 10,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  })

  useImperativeHandle(
    ref,
    () => ({
      scrollToTrack(id: string) {
        const idx = tracksRef.current.findIndex((tr) => tr._id === id)
        if (idx !== -1) virtualizer.scrollToIndex(idx, { align: 'center', behavior: 'smooth' })
      },
    }),
    [virtualizer],
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

  // The pointer is always within the currently-rendered (visible + overscan)
  // window while dragging — a physical constraint, since the pointer itself
  // has to stay on screen — so we never need an off-screen row's position;
  // this reads positions from the virtualizer's own measurements instead of
  // live DOM rects.
  const handleMove = useCallback(
    (clientY: number) => {
      const dragId = activeId.current
      if (!dragId) return
      const current = tracksRef.current
      const otherIds = current.filter((tr) => tr._id !== dragId).map((tr) => tr._id)
      const docY = clientY + window.scrollY

      let dropIndex = otherIds.length
      for (const item of virtualizer.getVirtualItems()) {
        const track = current[item.index]
        if (!track || track._id === dragId) continue
        if (docY < item.start + item.size / 2) {
          dropIndex = otherIds.indexOf(track._id)
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
    },
    [onChange, virtualizer],
  )

  const endDrag = useCallback(() => {
    const wasDragging = activeId.current
    activeId.current = null
    setDraggingId(null)
    document.body.style.userSelect = ''
    if (wasDragging && changedDuringDrag.current) {
      void persistOrder(tracksRef.current.map((tr) => tr._id))
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
    if (dx > MOVE_CANCEL_THRESHOLD || dy > MOVE_CANCEL_THRESHOLD) clearLongPress()
  }

  function onRowPointerUp() {
    clearLongPress()
  }

  return (
    <div ref={listRef} className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const track = tracks[virtualRow.index]
        if (!track) return null
        const isDragging = draggingId === track._id
        return (
          <div
            key={track._id}
            ref={virtualizer.measureElement}
            data-index={virtualRow.index}
            id={`track-${track._id}`}
            onPointerDown={(e) => onRowPointerDown(e, track._id)}
            onPointerMove={onRowPointerMoveWhileArming}
            onPointerUp={onRowPointerUp}
            onPointerLeave={onRowPointerUp}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
              paddingBottom: 4,
              touchAction: isDragging ? 'none' : undefined,
            }}
            className={
              isDragging
                ? 'z-10 scale-[1.015] cursor-grabbing rounded-xl bg-card shadow-xl ring-1 ring-border'
                : highlightId === track._id
                  ? 'cursor-default rounded-xl ring-2 ring-primary transition-shadow'
                  : 'cursor-default rounded-xl ring-0 transition-shadow'
            }
          >
            <div className="flex items-center">
              <div
                className={
                  isDragging
                    ? 'flex w-5 shrink-0 items-center justify-center text-muted-foreground transition-colors'
                    : 'flex w-5 shrink-0 items-center justify-center text-transparent transition-colors'
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
          </div>
        )
      })}
    </div>
  )
})
