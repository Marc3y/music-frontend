'use client'

import { motion, useInView, useReducedMotion } from 'motion/react'
import { useRef, type ReactNode } from 'react'

export function Reveal({
  children,
  className,
  delayIndex = 0,
  y = 10,
}: {
  children: ReactNode
  className?: string
  delayIndex?: number
  once?: boolean
  y?: number
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

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
      transition={{ type: 'spring', bounce: 0, duration: 0.5, delay: delayIndex * 0.05 }}
    >
      {children}
    </motion.div>
  )
}
