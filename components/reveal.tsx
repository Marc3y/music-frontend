'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { ease } from '@/lib/motion'

export function Reveal({
  children,
  className,
  delayIndex = 0,
  once = true,
  y = 20,
}: {
  children: ReactNode
  className?: string
  delayIndex?: number
  once?: boolean
  y?: number
}) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delayIndex * 0.07, ease: ease.out }}
      viewport={{ once, amount: 0.25 }}
    >
      {children}
    </motion.div>
  )
}
