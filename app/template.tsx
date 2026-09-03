'use client'

import { motion, useReducedMotion } from 'motion/react'
import { ease } from '@/lib/motion'

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: ease.out }}
    >
      {children}
    </motion.div>
  )
}
