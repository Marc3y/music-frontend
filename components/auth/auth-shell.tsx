'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Logo } from '@/components/logo'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px]"
        style={{
          background:
            'radial-gradient(70% 60% at 50% 0%, oklch(0.55 0.27 295 / 0.25), transparent 70%)',
        }}
      />

      <Link href="/" className="relative mb-8">
        <Logo className="[&_span]:text-xl" />
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm rounded-3xl border border-border bg-card/70 p-7 shadow-2xl backdrop-blur-xl"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm text-pretty text-muted-foreground">{subtitle}</p>
        )}
        <div className="mt-6">{children}</div>
      </motion.div>

      {footer && (
        <p className="relative mt-6 text-sm text-muted-foreground">{footer}</p>
      )}
    </main>
  )
}
