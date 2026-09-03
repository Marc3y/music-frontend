'use client'

import { motion, useInView, useReducedMotion } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { ease } from '@/lib/motion'

export function Reveal({
  children,
  className,
  delayIndex = 0,
  y = 20,
}: {
  children: ReactNode
  className?: string
  delayIndex?: number
  once?: boolean
  y?: number
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  // `once: true` latches — stays true across re-renders, so closing a dialog
  // (or any parent re-render) can never snap the content back to hidden.
  const inView = useInView(ref, { once: true, amount: 0.25 })

  if (reduce) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.6, delay: delayIndex * 0.07, ease: ease.out }}
    >
      {children}
    </motion.div>
  )
}
