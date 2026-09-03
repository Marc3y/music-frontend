'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Download, Loader2, Music, Pause, Play } from 'lucide-react'
import { Logo } from '@/components/logo'
import { AuroraBackground } from '@/components/aurora-background'
import { Button } from '@/components/ui/button'
import { AddToLibraryButton } from '@/components/app/add-to-library-button'
import { audioApi, ApiError } from '@/lib/api'
import { usePlayer } from '@/lib/player-context'
import { useT } from '@/lib/i18n/context'

interface SharedTrack {
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

  useEffect(() => {
    audioApi
      .publicStream(token)
      .then((res) =>
        setTrack({
          title: res.title,
          artist: res.artist,
          description: res.description,
          bpm: res.bpm,
          musicalKey: res.musicalKey,
          projectUrl: res.projectUrl,
          projectFilename: res.projectFilename,
        }),
      )
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? t('publicShare.linkInvalid')
            : t('publicShare.trackLoadFailed'),
        ),
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

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
          const res = await audioApi.publicStream(token)
          return res.streamUrl
        },
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
                {[track.bpm ? `${track.bpm} BPM` : null, track.musicalKey || null]
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
