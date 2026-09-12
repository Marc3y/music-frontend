'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Avatar } from '@base-ui/react/avatar'
import { BarChart3, Download, Headphones, Music, Users } from 'lucide-react'
import { RequireAuth } from '@/components/app/require-auth'
import { AppNav } from '@/components/app/app-nav'
import { AuroraBackground } from '@/components/aurora-background'
import { Reveal } from '@/components/reveal'
import { Skeleton } from '@/components/ui/skeleton'
import { CoverImage } from '@/components/ui/cover-image'
import { accountApi } from '@/lib/api'
import { useT } from '@/lib/i18n/context'
import { ease } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { AccountStats, StatTrack } from '@/lib/types'

function StatTile({
  icon: Icon,
  value,
  label,
  delay,
}: {
  icon: typeof Music
  value: number | string
  label: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: ease.out }}
      className="glass flex flex-col gap-1 rounded-2xl p-4 shadow-(--elevate-1)"
    >
      <Icon className="size-4 text-muted-foreground" />
      <span className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </motion.div>
  )
}

function BarList({
  title,
  icon: Icon,
  rows,
}: {
  title: string
  icon: typeof Music
  rows: { key: string; label: string; sub?: string | null; value: number; cover?: string | null }[]
}) {
  const t = useT()
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="glass rounded-2xl p-5 shadow-(--elevate-1)">
      <p className="mb-4 flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-muted-foreground" />
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t('stats.empty')}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {rows.map((r, i) => (
            <motion.li
              key={r.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: ease.out }}
              className="flex items-center gap-3"
            >
              <span className="w-4 shrink-0 text-right text-xs font-medium text-muted-foreground tabular-nums">
                {i + 1}
              </span>
              {r.cover !== undefined && (
                <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary/25 to-accent/15">
                  {r.cover ? (
                    <CoverImage src={r.cover} alt="" sizes="36px" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Music className="size-4 text-foreground/40" />
                    </div>
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.label}</p>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(4, (r.value / max) * 100)}%` }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.04, ease: ease.out }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{r.value}</span>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  )
}

function Sparkline({ data }: { data: { _id: string; listens: number }[] }) {
  const t = useT()
  if (data.length < 2) return null
  const max = Math.max(1, ...data.map((d) => d.listens))
  const w = 100
  const h = 32
  const pts = data
    .map((d, i) => `${(i / (data.length - 1)) * w},${h - (d.listens / max) * h}`)
    .join(' ')
  return (
    <div className="glass rounded-2xl p-5 shadow-(--elevate-1)">
      <p className="mb-3 text-sm font-medium">{t('stats.last30Days')}</p>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-16 w-full">
        <motion.polyline
          points={pts}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: ease.out }}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}

export default function StatsPage() {
  const t = useT()
  const [stats, setStats] = useState<AccountStats | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    accountApi
      .stats()
      .then(setStats)
      .catch(() => setFailed(true))
  }, [])

  const trackRows = (list: StatTrack[], field: 'listens' | 'downloads') =>
    list.map((s) => ({
      key: s.trackId,
      label: s.title,
      sub: s.artist,
      value: s[field],
      cover: s.coverUrl ?? null,
    }))

  return (
    <RequireAuth>
      <div className="relative min-h-dvh pb-32">
        <AuroraBackground variant="page" />

        <div className="relative isolate">
          <AppNav />

          <main className="mx-auto max-w-3xl px-4 pt-4 sm:px-6">
            <Reveal className="pb-8">
              <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
                <BarChart3 className="size-7 text-primary" />
                {t('stats.title')}
              </h1>
              <p className="mt-1 text-muted-foreground">{t('stats.subtitle')}</p>
            </Reveal>

            {failed ? (
              <p className="text-sm text-muted-foreground">{t('stats.failed')}</p>
            ) : !stats ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatTile icon={Headphones} value={stats.totals.listens} label={t('stats.totalListens')} delay={0} />
                  <StatTile icon={Users} value={stats.totals.uniqueListeners} label={t('stats.uniqueListeners')} delay={0.05} />
                  <StatTile icon={Download} value={stats.totals.downloads} label={t('stats.totalDownloads')} delay={0.1} />
                  <StatTile icon={Music} value={stats.totals.trackCount} label={t('stats.trackCount')} delay={0.15} />
                </div>

                <Reveal delayIndex={1}>
                  <BarList
                    title={t('stats.topTracks')}
                    icon={Headphones}
                    rows={trackRows(stats.topTracks.slice(0, 8), 'listens')}
                  />
                </Reveal>

                {stats.topListeners.length > 0 && (
                  <Reveal delayIndex={2}>
                    <div className="glass rounded-2xl p-5 shadow-(--elevate-1)">
                      <p className="mb-4 flex items-center gap-2 text-sm font-medium">
                        <Users className="size-4 text-muted-foreground" />
                        {t('stats.topListeners')}
                      </p>
                      <ol className="flex flex-col gap-3">
                        {stats.topListeners.map((l, i) => {
                          const max = Math.max(1, ...stats.topListeners.map((x) => x.listens))
                          return (
                            <li key={l.username + i} className="flex items-center gap-3">
                              <span className="w-4 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                                {i + 1}
                              </span>
                              <Avatar.Root className="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/30 to-accent/20 text-xs font-medium text-primary-foreground uppercase">
                                {l.avatarUrl ? (
                                  <Avatar.Image src={l.avatarUrl} alt="" className="size-full object-cover" />
                                ) : null}
                                <Avatar.Fallback>{l.username.slice(0, 1)}</Avatar.Fallback>
                              </Avatar.Root>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">@{l.username}</p>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                  <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-accent/70 to-accent"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(4, (l.listens / max) * 100)}%` }}
                                    transition={{ duration: 0.6, delay: 0.1 + i * 0.04, ease: ease.out }}
                                  />
                                </div>
                              </div>
                              <span className="shrink-0 text-sm font-semibold tabular-nums">
                                {l.listens}
                              </span>
                            </li>
                          )
                        })}
                      </ol>
                    </div>
                  </Reveal>
                )}

                {stats.topDownloaded.length > 0 && (
                  <Reveal delayIndex={3}>
                    <BarList
                      title={t('stats.topDownloaded')}
                      icon={Download}
                      rows={trackRows(stats.topDownloaded.slice(0, 6), 'downloads')}
                    />
                  </Reveal>
                )}

                {stats.perDay.length >= 2 && (
                  <Reveal delayIndex={4}>
                    <Sparkline data={stats.perDay} />
                  </Reveal>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </RequireAuth>
  )
}
