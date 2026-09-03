'use client'

import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

type Variant = 'page' | 'auth' | 'minimal'

/**
 * Ruhiger Seitenhintergrund: ein kühler + ein warmer weicher Blob, dazu ein
 * sehr feines Raster. Ersetzt die überall duplizierten inline-Gradient-Blöcke.
 */
export function AuroraBackground({
  variant = 'page',
  className,
}: {
  variant?: Variant
  className?: string
}) {
  const reduce = useReducedMotion()

  const drift = reduce
    ? {}
    : {
        animate: { x: [0, 24, -12, 0], y: [0, -18, 12, 0], scale: [1, 1.06, 0.97, 1] },
        transition: { duration: 26, repeat: Infinity, ease: 'easeInOut' as const },
      }
  const drift2 = reduce
    ? {}
    : {
        animate: { x: [0, -28, 14, 0], y: [0, 16, -14, 0], scale: [1, 0.95, 1.05, 1] },
        transition: { duration: 32, repeat: Infinity, ease: 'easeInOut' as const },
      }

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {variant !== 'minimal' && <div className="absolute inset-0 bg-grid opacity-70" />}

      <motion.div
        {...drift}
        className={cn(
          'absolute rounded-full blur-[100px]',
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
        {...drift2}
        className="absolute size-[34rem] rounded-full blur-[120px]"
        style={{
          top: variant === 'auth' ? '2rem' : '6rem',
          right: '-14rem',
          background:
            'radial-gradient(circle at center, var(--glow-warm), transparent 70%)',
        }}
      />
    </div>
  )
}
