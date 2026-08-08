'use client'

import { motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
  }),
}

export function Reveal({
  children,
  className,
  delayIndex = 0,
  once = true,
}: {
  children: ReactNode
  className?: string
  delayIndex?: number
  once?: boolean
}) {
  return (
    <motion.div
      className={className}
      variants={variants}
      custom={delayIndex}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
