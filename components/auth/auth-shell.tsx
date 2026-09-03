'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { AuroraBackground } from '@/components/aurora-background'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { ease } from '@/lib/motion'

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
      <AuroraBackground variant="auth" />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <Link href="/" className="relative mb-8">
        <Logo className="[&_span]:text-xl" />
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: ease.out }}
        className="glass relative w-full max-w-sm rounded-3xl p-7 shadow-(--elevate-3)"
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
