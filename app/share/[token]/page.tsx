'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Loader2, Music, Pause, Play } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { audioApi, ApiError } from '@/lib/api'
import { usePlayer } from '@/lib/player-context'

interface SharedTrack {
  title: string
  artist?: string
  description?: string
}

export default function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const player = usePlayer()

  const [track, setTrack] = useState<SharedTrack | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    audioApi
      .publicStream(token)
      .then((res) =>
        setTrack({ title: res.title, artist: res.artist, description: res.description }),
      )
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? 'Dieser Link ist ungültig oder wurde deaktiviert.'
            : 'Track konnte nicht geladen werden.',
        ),
      )
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
        title: track?.title ?? 'Track',
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
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px]"
        style={{
          background:
            'radial-gradient(70% 60% at 50% 0%, oklch(0.55 0.27 295 / 0.25), transparent 70%)',
        }}
      />

      <Link href="/" className="relative mb-8">
        <Logo className="[&_span]:text-xl" />
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm rounded-3xl border border-border bg-card/70 p-7 text-center shadow-2xl backdrop-blur-xl"
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
              {track.artist || 'Unbekannter Interpret'}
            </p>
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
              {isCurrent && player.isPlaying ? 'Pause' : 'Abspielen'}
            </Button>
          </>
        )}
      </motion.div>

      <p className="relative mt-6 text-sm text-muted-foreground">
        Geteilt über <span className="font-medium text-foreground">music</span>
      </p>
    </main>
  )
}
