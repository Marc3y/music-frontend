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

export const AuroraBackground = memo(function AuroraBackground({
  variant = 'page',
  className,
}: {
  variant?: Variant
  className?: string
}) {
  const reduce = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  const inView = useInView(containerRef, { amount: 0 })
  const controls1 = useAnimation()
  const controls2 = useAnimation()

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

      className={cn(
        'pointer-events-none absolute inset-0 isolate transform-gpu overflow-hidden',
        className,
      )}
    >
      {variant !== 'minimal' && (
        <div className="absolute inset-0 bg-grid opacity-70 will-change-transform" />
      )}

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
