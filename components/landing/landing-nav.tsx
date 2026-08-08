'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'

export function LandingNav() {
  const { user, loading } = useAuth()

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-2 backdrop-blur-xl">
          <Logo />
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 p-1.5 backdrop-blur-xl">
          {loading ? (
            <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
          ) : user ? (
            <Button render={<Link href="/library" />} size="lg">
              Zur Mediathek
            </Button>
          ) : (
            <>
              <Button render={<Link href="/login" />} variant="ghost" size="lg">
                Anmelden
              </Button>
              <Button render={<Link href="/register" />} size="lg">
                Registrieren
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  )
}
