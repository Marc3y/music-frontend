'use client'

import Link from 'next/link'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { useT } from '@/lib/i18n/context'
import { ease } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function LandingNav() {
  const { user, loading } = useAuth()
  const t = useT()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 8))

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: ease.out }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={cn(
          'mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 transition-[padding] duration-300 ease-apple sm:px-4',
          scrolled ? 'py-2.5' : 'py-4',
        )}
      >
        <Link
          href="/"
          className={cn(
            'glass rounded-full px-4 py-2 transition-shadow duration-300',
            scrolled && 'shadow-(--elevate-2)',
          )}
        >
          <Logo />
        </Link>
        <div
          className={cn(
            'glass flex items-center gap-1.5 rounded-full p-1.5 pl-2 transition-shadow duration-300',
            scrolled && 'shadow-(--elevate-2)',
          )}
        >
          <ThemeToggle />
          {loading ? (
            <div className="h-9 w-28 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <Button render={<Link href="/library" />}>{t('nav.toLibrary')}</Button>
          ) : (
            <>
              <Button render={<Link href="/login" />} variant="ghost">
                {t('nav.signIn')}
              </Button>
              <Button render={<Link href="/register" />}>{t('nav.signUp')}</Button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  )
}
