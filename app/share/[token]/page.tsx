'use client'

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Download, Loader2, Lock, Music, Pause, Play } from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/logo'
import { AuroraBackground } from '@/components/aurora-background'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AddToLibraryButton } from '@/components/app/add-to-library-button'
import { audioApi, ApiError } from '@/lib/api'
import { usePlayer } from '@/lib/player-context'
import { formatMusicalKey } from '@/lib/format'
import { useT } from '@/lib/i18n/context'

interface SharedTrack {
  _id?: string
  title: string
  artist?: string
  description?: string
  bpm?: number | null
  musicalKey?: string | null
  projectUrl?: string
  projectFilename?: string
}

export default function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const player = usePlayer()
  const t = useT()

  const [track, setTrack] = useState<SharedTrack | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [unlockKey, setUnlockKey] = useState<string | null>(null)
  const [pw, setPw] = useState('')
  const [unlocking, setUnlocking] = useState(false)

  const storageKey = `music.unlock.${token}`

  const load = useCallback(
    (key: string | null) => {
      audioApi
        .publicStream(token, key)
        .then((res) => {
          setTrack({
            _id: res._id,
            title: res.title,
            artist: res.artist,
            description: res.description,
            bpm: res.bpm,
            musicalKey: res.musicalKey,
            projectUrl: res.projectUrl,
            projectFilename: res.projectFilename,
          })
          setNeedsPassword(false)
          setError(null)
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) {
            setNeedsPassword(true)
            try {
              sessionStorage.removeItem(storageKey)
            } catch {
              /* ignore */
            }
            return
          }
          setError(
            err instanceof ApiError
              ? t('publicShare.linkInvalid')
              : t('publicShare.trackLoadFailed'),
          )
        })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token],
  )

  useEffect(() => {
    let stored: string | null = null
    try {
      stored = sessionStorage.getItem(storageKey)
    } catch {
      /* ignore */
    }
    setUnlockKey(stored)
    load(stored)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function submitPassword() {
    if (!pw.trim()) return
    setUnlocking(true)
    try {
      const res = await audioApi.unlockShare(token, pw)
      try {
        sessionStorage.setItem(storageKey, res.unlockKey)
      } catch {
        /* ignore */
      }
      setUnlockKey(res.unlockKey)
      setPw('')
      load(res.unlockKey)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('publicShare.wrongPassword'))
    } finally {
      setUnlocking(false)
    }
  }

  const isCurrent = player.current?.id === `share-${token}`

  function handlePlay() {
    if (isCurrent) {
      player.togglePlay()
      return
    }
    player.playQueue([
      {
        id: `share-${token}`,
        title: track?.title ?? '',
        artist: track?.artist,
        getStreamUrl: async () => {
          const res = await audioApi.publicStream(token, unlockKey)
          return res.streamUrl
        },
        onListened: track?._id
          ? () => audioApi.logListen(track._id!).catch(() => {})
          : undefined,
      },
    ])
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-16">
      <AuroraBackground variant="auth" />

      <Link href="/" className="relative mb-8">
        <Logo className="[&_span]:text-xl" />
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass relative w-full max-w-sm rounded-3xl p-7 text-center shadow-(--elevate-3)"
      >
        {error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : needsPassword ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Lock className="size-5" />
            </span>
            <div>
              <p className="font-medium">{t('publicShare.passwordTitle')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('publicShare.passwordBody')}
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void submitPassword()
              }}
              className="flex w-full max-w-xs gap-2"
            >
              <Input
                type="password"
                autoFocus
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder={t('publicShare.passwordPlaceholder')}
              />
              <Button type="submit" disabled={unlocking || !pw.trim()}>
                {unlocking ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  t('publicShare.unlock')
                )}
              </Button>
            </form>
          </div>
        ) : !track ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="mx-auto flex size-28 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 glow-primary">
              <Music className="size-10 text-foreground/50" />
            </div>
            <h1 className="mt-5 text-xl font-semibold text-balance">{track.title}</h1>
            <p className="mt-1 text-muted-foreground">
              {track.artist || t('publicShare.unknownArtist')}
            </p>
            {(track.bpm || track.musicalKey) && (
              <p className="mt-2 text-sm text-muted-foreground">
                {[track.bpm ? `${track.bpm} BPM` : null, formatMusicalKey(track.musicalKey) || null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            {track.description && (
              <p className="mt-3 text-sm text-pretty text-muted-foreground">
                {track.description}
              </p>
            )}

            <Button size="lg" className="mt-6 h-11 w-full" onClick={handlePlay}>
              {isCurrent && player.isPlaying ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
              {isCurrent && player.isPlaying ? t('publicShare.pause') : t('publicShare.play')}
            </Button>

            {track.projectUrl && (
              <a
                href={track.projectUrl}
                className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium transition-colors hover:bg-muted"
              >
                <Download className="size-4" />
                {t('publicShare.downloadProjectFile')}
              </a>
            )}

            <AddToLibraryButton token={token} type="audio" />
          </>
        )}
      </motion.div>

      <p className="relative mt-6 text-sm text-muted-foreground">
        {t('publicShare.sharedVia')} <span className="font-medium text-foreground">music</span>
      </p>
    </main>
  )
}
