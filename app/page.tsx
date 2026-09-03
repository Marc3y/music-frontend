'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import {
  AudioLines,
  FolderPlus,
  Play,
  Share2,
  SkipBack,
  SkipForward,
  Sparkles,
  UploadCloud,
  Waves,
} from 'lucide-react'
import { LandingNav } from '@/components/landing/landing-nav'
import { AuroraBackground } from '@/components/aurora-background'
import { Reveal } from '@/components/reveal'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { useT } from '@/lib/i18n/context'
import { ease, liftHover } from '@/lib/motion'

const features = [
  { icon: FolderPlus, key: 'playlists' },
  { icon: UploadCloud, key: 'upload' },
  { icon: Waves, key: 'streaming' },
  { icon: AudioLines, key: 'metadata' },
  { icon: Share2, key: 'sharing' },
  { icon: Sparkles, key: 'minimal' },
] as const

export default function LandingPage() {
  const { user } = useAuth()
  const t = useT()
  const primaryHref = user ? '/library' : '/register'

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <AuroraBackground variant="page" />

      <LandingNav />

      {/* Hero */}
      <section className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pt-40 pb-24 text-center sm:pt-48">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-muted-foreground"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          {t('landing.badge')}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mt-6 text-5xl font-semibold tracking-tight text-balance sm:text-7xl"
        >
          {t('landing.heroTitle')}{' '}
          <span className="text-gradient">{t('landing.heroTitleAccent')}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground"
        >
          {t('landing.heroSubtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Button render={<Link href={primaryHref} />} size="lg">
            {user ? t('landing.ctaPrimaryUser') : t('landing.ctaPrimaryGuest')}
          </Button>
          {!user && (
            <Button render={<Link href="/login" />} variant="outline" size="lg">
              {t('landing.ctaSecondary')}
            </Button>
          )}
        </motion.div>

        {/* Floating player mock */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.35, ease: ease.out }}
          className="mt-20 w-full max-w-2xl"
        >
          <PlayerMock />
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t('landing.featuresTitle')}
          </h2>
          <p className="mt-4 text-muted-foreground text-pretty">
            {t('landing.featuresSubtitle')}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.key} delayIndex={i % 3}>
              <motion.div
                {...liftHover}
                className="group glass h-full rounded-2xl p-6 shadow-(--elevate-1) transition-shadow duration-300 hover:shadow-(--elevate-2)"
              >
                <motion.div
                  whileHover={{ scale: 1.08, rotate: -3 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary"
                >
                  <f.icon className="size-5" />
                </motion.div>
                <h3 className="mt-5 text-lg font-medium">
                  {t(`landing.features.${f.key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`landing.features.${f.key}.desc`)}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-3xl px-6 py-16 text-center shadow-(--elevate-2) sm:px-16">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(70% 120% at 15% 0%, var(--glow-cool), transparent 60%), radial-gradient(60% 120% at 100% 100%, var(--glow-warm), transparent 60%)',
              }}
            />
            <div className="relative">
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {t('landing.ctaSectionTitle')}
              </h2>
              <p className="mx-auto mt-4 max-w-md text-muted-foreground text-pretty">
                {t('landing.ctaSectionSubtitle')}
              </p>
              <Button
                render={<Link href={primaryHref} />}
                size="lg"
                className="mt-8"
              >
                {user ? t('landing.ctaSectionButtonUser') : t('landing.ctaSectionButtonGuest')}
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-border px-4 py-10 sm:flex-row">
        <Logo />
        <p className="text-sm text-muted-foreground">
          {new Date().getFullYear()} {t('landing.footerTagline')}
        </p>
      </footer>
    </main>
  )
}

function PlayerMock() {
  const bars = Array.from({ length: 48 }, (_, i) => 0.2 + Math.abs(Math.sin(i * 0.5)) * 0.8)
  return (
    <div className="glass rounded-3xl p-5 shadow-(--elevate-3) glow-primary">
      <div className="flex items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-[0_8px_24px_-8px_var(--primary)]">
          <AudioLines className="size-6 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate font-medium">Midnight Frequencies</p>
          <p className="truncate text-sm text-muted-foreground">Nova</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-secondary/60 p-1.5">
          <span className="flex size-8 items-center justify-center rounded-full text-muted-foreground">
            <SkipBack className="size-4" />
          </span>
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-(--elevate-1)">
            <Play className="size-4 translate-x-px fill-current" />
          </span>
          <span className="flex size-8 items-center justify-center rounded-full text-muted-foreground">
            <SkipForward className="size-4" />
          </span>
        </div>
      </div>
      <div className="mt-5 flex h-16 items-center gap-[3px]">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0.3 }}
            animate={{ scaleY: [0.3, h, 0.4] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatType: 'mirror',
              delay: i * 0.03,
            }}
            className={`flex-1 rounded-full ${i < 20 ? 'bg-primary' : 'bg-foreground/20'}`}
            style={{ height: `${Math.round(h * 100)}%`, transformOrigin: 'center' }}
          />
        ))}
      </div>
    </div>
  )
}
