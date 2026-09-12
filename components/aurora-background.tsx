'use client'

import { memo, useEffect, useRef } from 'react'
import { motion, useAnimation, useInView, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

type Variant = 'page' | 'auth' | 'minimal'

const DRIFT = {
  animate: { x: [0, 24, -12, 0], y: [0, -18, 12, 0], scale: [1, 1.06, 0.97, 1] },
  transition: { duration: 26, repeat: Infinity, ease: 'easeInOut' as const },
}
const DRIFT2 = {
  animate: { x: [0, -28, 14, 0], y: [0, 16, -14, 0], scale: [1, 0.95, 1.05, 1] },
  transition: { duration: 32, repeat: Infinity, ease: 'easeInOut' as const },
}

/**
 * Ruhiger Seitenhintergrund: ein kühler + ein warmer weicher Blob, dazu ein
 * sehr feines Raster. Ersetzt die überall duplizierten inline-Gradient-Blöcke.
 *
 * `memo` + module-level animation configs: the page re-renders on every dialog
 * open/close, and without this the drifting blobs' keyframe animations would
 * restart on each render and visibly jump.
 */
export const AuroraBackground = memo(function AuroraBackground({
  variant = 'page',
  className,
}: {
  variant?: Variant
  className?: string
}) {
  const reduce = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  // `amount: 0`: still "in view" as long as a single pixel is on screen —
  // matches how easily visible this full-bleed background actually is.
  const inView = useInView(containerRef, { amount: 0 })
  const controls1 = useAnimation()
  const controls2 = useAnimation()

  // Freeze the drift animations (instead of endlessly ticking rAF) once the
  // background scrolls off-screen or the tab is backgrounded — invisible by
  // definition, since nothing is rendering it at that point.
  useEffect(() => {
    if (reduce) return
    if (inView) {
      void controls1.start(DRIFT.animate, DRIFT.transition)
      void controls2.start(DRIFT2.animate, DRIFT2.transition)
    } else {
      controls1.stop()
      controls2.stop()
    }
  }, [inView, reduce, controls1, controls2])

  return (
    <div
      ref={containerRef}
      aria-hidden
      // `isolate` + `transform-gpu`: keeps this whole expensive layer (huge
      // blurs + a masked grid) on its own compositor layer so it is NOT
      // re-rasterized when a dialog/overlay mounts or unmounts above it — that
      // re-raster is what made the page flash on every dialog close.
      className={cn(
        'pointer-events-none absolute inset-0 isolate transform-gpu overflow-hidden',
        className,
      )}
    >
      {variant !== 'minimal' && (
        <div className="absolute inset-0 bg-grid opacity-70 will-change-transform" />
      )}

      {/* Optional pattern from the chosen background preset. `currentColor`
          (= text-foreground) keeps it readable in both themes. */}
      <div
        className="absolute inset-0 text-foreground"
        style={{
          backgroundImage: 'var(--aurora-pattern)',
          backgroundSize: 'var(--aurora-pattern-size)',
          backgroundPosition: 'var(--aurora-pattern-position)',
          opacity: 'var(--aurora-pattern-opacity)',
        }}
      />


      <motion.div
        animate={reduce ? undefined : controls1}
        className={cn(
          'absolute rounded-full blur-[100px] will-change-transform',
          variant === 'auth' ? 'size-[40rem]' : 'size-[52rem]',
        )}
        style={{
          top: variant === 'auth' ? '-18rem' : '-24rem',
          left: '50%',
          marginLeft: variant === 'auth' ? '-20rem' : '-26rem',
          background:
            'radial-gradient(circle at center, var(--glow-cool), transparent 70%)',
        }}
      />
      <motion.div
        animate={reduce ? undefined : controls2}
        className="absolute size-[34rem] rounded-full blur-[120px] will-change-transform"
        style={{
          top: variant === 'auth' ? '2rem' : '6rem',
          right: '-14rem',
          background:
            'radial-gradient(circle at center, var(--glow-warm), transparent 70%)',
        }}
      />
    </div>
  )
})
