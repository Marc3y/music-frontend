'use client'

import Link from 'next/link'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { useT } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

export function LandingNav() {
  const { user, loading } = useAuth()
  const t = useT()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 8))

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300 ease-apple',
        scrolled ? 'material-bar border-border' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="-ml-1 rounded-lg px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <Button render={<Link href="/library" />} size="sm" className="rounded-full px-3.5">
              {t('nav.toLibrary')}
            </Button>
          ) : (
            <>
              <Button render={<Link href="/login" />} variant="ghost" size="sm" className="rounded-full px-3">
                {t('nav.signIn')}
              </Button>
              <Button render={<Link href="/register" />} size="sm" className="rounded-full px-3.5">
                {t('nav.signUp')}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
