'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ease } from '@/lib/motion'

const LONG_PRESS_MS = 240
const MOVE_CANCEL_THRESHOLD = 8

type WithId = { _id: string }

export function ReorderablePlaylistGrid<T extends WithId>({
  items,
  onOrderChange,
  onPersist,
  renderItem,
}: {
  items: T[]
  onOrderChange: (items: T[]) => void
  onPersist: (orderedIds: string[]) => void
  renderItem: (item: T) => React.ReactNode
}) {
  const reduce = useReducedMotion()
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const itemsRef = useRef(items)
  itemsRef.current = items

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

  const handleMove = useCallback(
    (x: number, y: number) => {
      const dragId = activeId.current
      if (!dragId) return
      const current = itemsRef.current
      const otherIds = current.filter((it) => it._id !== dragId).map((it) => it._id)

      let closest = otherIds.length
      let best = Infinity
      for (let i = 0; i < otherIds.length; i++) {
        const el = cardRefs.current.get(otherIds[i])
        if (!el) continue
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const d = (cx - x) ** 2 + (cy - y) ** 2
        if (d < best) {
          best = d
          // insert before this card if pointer is left/above its center, else after
          const after = y > cy + 4 || (Math.abs(y - cy) <= r.height / 2 && x > cx)
          closest = after ? i + 1 : i
        }
      }

      const newIds = [...otherIds]
      newIds.splice(Math.min(closest, otherIds.length), 0, dragId)

      const currentIds = current.map((it) => it._id)
      if (newIds.join('|') !== currentIds.join('|')) {
        changedDuringDrag.current = true
        const byId = new Map(current.map((it) => [it._id, it]))
        onOrderChange(newIds.map((id) => byId.get(id)!))
      }
    },
    [onOrderChange],
  )

  const endDrag = useCallback(() => {
    const wasDragging = activeId.current
    activeId.current = null
    setDraggingId(null)
    document.body.style.userSelect = ''
    if (wasDragging && changedDuringDrag.current) {
      onPersist(itemsRef.current.map((it) => it._id))
    }
    changedDuringDrag.current = false
  }, [onPersist])

  useEffect(() => {
    if (!draggingId) return
    function onPointerMove(e: PointerEvent) {
      e.preventDefault()
      handleMove(e.clientX, e.clientY)
    }
    function onPointerUp() {
      endDrag()
    }
    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [draggingId, handleMove, endDrag])

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>, id: string) {
    if ((e.target as HTMLElement).closest('button')) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    startPos.current = { x: e.clientX, y: e.clientY }
    clearLongPress()
    longPressTimer.current = setTimeout(() => {
      activeId.current = id
      changedDuringDrag.current = false
      setDraggingId(id)
      document.body.style.userSelect = 'none'
    }, LONG_PRESS_MS)
  }

  function onPointerMoveWhileArming(e: React.PointerEvent<HTMLDivElement>) {
    if (activeId.current) return
    if (!longPressTimer.current) return
    const dx = Math.abs(e.clientX - startPos.current.x)
    const dy = Math.abs(e.clientY - startPos.current.y)
    if (dx > MOVE_CANCEL_THRESHOLD || dy > MOVE_CANCEL_THRESHOLD) clearLongPress()
  }

  function onPointerUp() {
    clearLongPress()
  }

  const reordering = draggingId !== null

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((item) => {
        const isDragging = draggingId === item._id
        return (
          <motion.div
            key={item._id}
            layout={reordering ? 'position' : false}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reordering
                ? { type: 'spring', stiffness: 500, damping: 40 }
                : { duration: 0.3, ease: ease.out }
            }
            ref={(el) => {
              if (el) cardRefs.current.set(item._id, el)
              else cardRefs.current.delete(item._id)
            }}
            onPointerDown={(e) => onPointerDown(e, item._id)}
            onPointerMove={onPointerMoveWhileArming}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{ touchAction: isDragging ? 'none' : undefined }}
            className={
              isDragging
                ? 'relative z-10 scale-[1.03] cursor-grabbing rounded-2xl shadow-xl ring-1 ring-primary/40'
                : 'cursor-default'
            }
          >
            {renderItem(item)}
          </motion.div>
        )
      })}
    </div>
  )
}
