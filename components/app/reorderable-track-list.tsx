'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { TrackRow } from '@/components/app/track-row'
import { audioApi, ApiError } from '@/lib/api'
import type { AudioFile } from '@/lib/types'

const LONG_PRESS_MS = 240
const MOVE_CANCEL_THRESHOLD = 6

export function ReorderableTrackList({
  playlistId,
  tracks,
  fallbackCoverUrl,
  currentId,
  isPlaying,
  isLoading,
  onPlay,
  onEdit,
  onShare,
  onVersions,
  onUpdated,
  onDeleted,
  onChange,
}: {
  playlistId: string
  tracks: AudioFile[]
  fallbackCoverUrl?: string | null
  currentId: string | null
  isPlaying: boolean
  isLoading: boolean
  onPlay: (track: AudioFile) => void
  onEdit: (track: AudioFile) => void
  onShare: (track: AudioFile) => void
  onVersions: (track: AudioFile) => void
  onUpdated: (track: AudioFile) => void
  onDeleted: (id: string) => void
  onChange: (tracks: AudioFile[]) => void
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const tracksRef = useRef(tracks)
  tracksRef.current = tracks

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const activeId = useRef<string | null>(null)
  const changedDuringDrag = useRef(false)

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
        toast.error(err instanceof ApiError ? err.message : 'Reihenfolge konnte nicht gespeichert werden')
      }
    },
    [playlistId],
  )

  const handleMove = useCallback((clientY: number) => {
    const dragId = activeId.current
    if (!dragId) return
    const current = tracksRef.current
    const otherIds = current.filter((t) => t._id !== dragId).map((t) => t._id)

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

    const currentIds = current.map((t) => t._id)
    if (newIds.join('|') !== currentIds.join('|')) {
      changedDuringDrag.current = true
      const byId = new Map(current.map((t) => [t._id, t]))
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
    // Don't arm dragging when interacting with buttons/menus inside the row
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
    if (activeId.current) return // already dragging, handled globally
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

  return (
    <div className="flex flex-col gap-1">
      {tracks.map((track) => {
        const isDragging = draggingId === track._id
        return (
          <motion.div
            key={track._id}
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
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
                ? 'z-10 scale-[1.015] cursor-grabbing rounded-xl bg-card shadow-xl ring-1 ring-border'
                : 'cursor-default'
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
                  fallbackCoverUrl={fallbackCoverUrl}
                  isCurrent={currentId === track._id}
                  isPlaying={isPlaying}
                  isLoading={isLoading}
                  onPlay={() => onPlay(track)}
                  onEdit={() => onEdit(track)}
                  onShare={() => onShare(track)}
                  onVersions={() => onVersions(track)}
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
}
