'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import {
  AudioLines,
  ChevronRight,
  FolderPlus,
  Pause,
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

const features = [
  { icon: FolderPlus, key: 'playlists' },
  { icon: UploadCloud, key: 'upload' },
  { icon: Waves, key: 'streaming' },
  { icon: AudioLines, key: 'metadata' },
  { icon: Share2, key: 'sharing' },
  { icon: Sparkles, key: 'minimal' },
] as const

const enter = { type: 'spring', bounce: 0, duration: 0.7 } as const

export default function LandingPage() {
  const { user } = useAuth()
  const t = useT()
  const reduce = useReducedMotion()
  const primaryHref = user ? '/library' : '/register'
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { ...enter, delay },
        }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <AuroraBackground variant="page" />

      <LandingNav />

      <section className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-36 pb-20 text-center sm:px-6 sm:pt-44">
        <motion.p {...rise(0)} className="text-sm font-medium text-muted-foreground">
          {t('landing.badge')}
        </motion.p>

        <motion.h1 {...rise(0.04)} className="display-1 mt-4 max-w-3xl text-balance">
          {t('landing.heroTitle')}{' '}
          <span className="text-muted-foreground">{t('landing.heroTitleAccent')}</span>
        </motion.h1>

        <motion.p
          {...rise(0.08)}
          className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground"
        >
          {t('landing.heroSubtitle')}
        </motion.p>

        <motion.div
          {...rise(0.12)}
          className="mt-9 flex flex-col items-center gap-2 sm:flex-row sm:gap-3"
        >
          <Button render={<Link href={primaryHref} />} size="lg" className="rounded-full px-6">
            {user ? t('landing.ctaPrimaryUser') : t('landing.ctaPrimaryGuest')}
          </Button>
          {!user && (
            <Button
              render={<Link href="/login" />}
              variant="ghost"
              size="lg"
              className="rounded-full pr-3.5 pl-5 text-primary hover:text-primary"
            >
              {t('landing.ctaSecondary')}
              <ChevronRight className="size-4" />
            </Button>
          )}
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.9, delay: 0.18 }}
          className="mt-16 w-full max-w-3xl sm:mt-20"
        >
          <AppPreview />
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Reveal className="max-w-2xl">
          <h2 className="display-2 text-balance">{t('landing.featuresTitle')}</h2>
          <p className="mt-4 text-lg text-pretty text-muted-foreground">
            {t('landing.featuresSubtitle')}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.key} delayIndex={i % 3} y={12}>
              <div className="border-t border-border pt-6">
                <f.icon className="size-5 text-foreground" strokeWidth={1.75} />
                <h3 className="mt-4 text-[1.0625rem] font-semibold tracking-[-0.012em]">
                  {t(`landing.features.${f.key}.title`)}
                </h3>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">
                  {t(`landing.features.${f.key}.desc`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 sm:pb-32">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-8 rounded-3xl border border-border bg-card px-6 py-10 sm:flex-row sm:items-center sm:px-12 sm:py-14">
            <div className="max-w-lg">
              <h2 className="display-2 text-balance">{t('landing.ctaSectionTitle')}</h2>
              <p className="mt-3 text-pretty text-muted-foreground">
                {t('landing.ctaSectionSubtitle')}
              </p>
            </div>
            <Button render={<Link href={primaryHref} />} size="lg" className="shrink-0 rounded-full px-6">
              {user ? t('landing.ctaSectionButtonUser') : t('landing.ctaSectionButtonGuest')}
            </Button>
          </div>
        </Reveal>
      </section>

      <footer className="relative border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t('landing.footerTagline')}
          </p>
        </div>
      </footer>
    </main>
  )
}

const previewTracks = [
  { title: 'Midnight Frequencies', artist: 'Nova', bpm: 92, key: 'Am', time: '3:12', hue: 268 },
  { title: 'Glass Harbor', artist: 'Nova', bpm: 104, key: 'F#m', time: '3:41', hue: 205 },
  { title: 'Low Tide', artist: 'Marcus K.', bpm: 87, key: 'Dm', time: '2:58', hue: 25 },
  { title: 'Static Bloom', artist: 'Nova feat. Lena', bpm: 118, key: 'G', time: '4:02', hue: 150 },
]

function Cover({ hue, className }: { hue: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={className}
      style={{
        background: `linear-gradient(140deg, oklch(0.62 0.13 ${hue}), oklch(0.32 0.09 ${hue + 30}))`,
      }}
    />
  )
}

function EqualizerIcon() {
  const reduce = useReducedMotion()
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      {[0.5, 1, 0.7].map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] origin-bottom rounded-full bg-primary"
          style={{ height: '100%', scaleY: h }}
          animate={reduce ? undefined : { scaleY: [h, 0.3, 1, h] }}
          transition={{ duration: 1.1 + i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

function AppPreview() {
  const peaks = Array.from({ length: 72 }, (_, i) => {
    const v = Math.abs(Math.sin(i * 0.37) * 0.6 + Math.sin(i * 0.11) * 0.4)
    return 0.18 + v * 0.82
  })

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card text-left shadow-(--elevate-3)">
      <div className="flex items-center gap-4 border-b border-border p-4 sm:gap-5 sm:p-6">
        <Cover hue={268} className="size-16 shrink-0 rounded-lg shadow-(--elevate-2) sm:size-20" />
        <div className="min-w-0">
          <p className="eyebrow">Playlist</p>
          <p className="mt-1.5 truncate text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
            Late Night Sessions
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">4 tracks · 13 min</p>
        </div>
      </div>

      <ul className="px-2 py-2 sm:px-3">
        {previewTracks.map((track, i) => {
          const active = i === 0
          return (
            <li
              key={track.title}
              className={`flex items-center gap-3 rounded-lg px-2 py-2 sm:px-3 ${active ? 'bg-muted' : ''}`}
            >
              <span className="flex w-4 shrink-0 justify-center text-xs text-muted-foreground tabular-nums">
                {active ? <EqualizerIcon /> : i + 1}
              </span>
              <Cover hue={track.hue} className="size-9 shrink-0 rounded-md" />
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-sm font-medium ${active ? 'text-primary' : ''}`}
                >
                  {track.title}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{track.artist}</span>
              </span>
              <span className="hidden w-16 text-right text-xs text-muted-foreground tabular-nums sm:block">
                {track.bpm} BPM
              </span>
              <span className="hidden w-10 text-right text-xs text-muted-foreground sm:block">
                {track.key}
              </span>
              <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                {track.time}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center gap-4 border-t border-border bg-background/50 px-4 py-3 sm:px-6">
        <div className="flex shrink-0 items-center gap-1 text-foreground">
          <span className="flex size-8 items-center justify-center text-muted-foreground">
            <SkipBack className="size-4 fill-current" />
          </span>
          <span className="flex size-9 items-center justify-center rounded-full bg-foreground text-background">
            <Pause className="size-4 fill-current" />
          </span>
          <span className="flex size-8 items-center justify-center text-muted-foreground">
            <SkipForward className="size-4 fill-current" />
          </span>
        </div>
        <span className="hidden text-xs text-muted-foreground tabular-nums sm:block">1:04</span>
        <div className="flex h-8 flex-1 items-center gap-[2px]">
          {peaks.map((h, i) => (
            <span
              key={i}
              className={`flex-1 rounded-full ${i < 24 ? 'bg-primary' : 'bg-foreground/15'}`}
              style={{ height: `${Math.round(h * 100)}%` }}
            />
          ))}
        </div>
        <span className="hidden text-xs text-muted-foreground tabular-nums sm:block">3:12</span>
      </div>
    </div>
  )
}
