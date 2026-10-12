'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { AuroraBackground } from '@/components/aurora-background'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

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
  const reduce = useReducedMotion()

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <AuroraBackground variant="auth" />

      <header className="relative z-10 mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="-ml-1 rounded-lg px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 pt-6 pb-20">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
          className="w-full max-w-[24rem]"
        >
          <div className="mb-7 text-center">
            <h1 className="title-1 text-balance">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-[0.9375rem] text-pretty text-muted-foreground">{subtitle}</p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-(--elevate-2) sm:p-7">
            {children}
          </div>

          {footer && (
            <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
          )}
        </motion.div>
      </div>
    </main>
  )
}
