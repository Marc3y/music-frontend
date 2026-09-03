'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Download, FileArchive, Loader2, Music, Pause, Play } from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/logo'
import { AuroraBackground } from '@/components/aurora-background'
import { AddToLibraryButton } from '@/components/app/add-to-library-button'
import { playlistApi, ApiError } from '@/lib/api'
import { usePlayer } from '@/lib/player-context'
import { formatTime } from '@/lib/format'
import type { PublicPlaylist, PublicPlaylistTrack } from '@/lib/types'

export default function PublicPlaylistPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const player = usePlayer()

  const [data, setData] = useState<PublicPlaylist | null>(null)
  const [error, setError] = useState<{ message: string; needsLogin?: boolean } | null>(null)

  useEffect(() => {
    playlistApi
      .publicGet(token)
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError) {
          setError({
            message: err.message,
            needsLogin: err.status === 403 && /einloggen/i.test(err.message),
          })
        } else {
          setError({ message: 'Playlist konnte nicht geladen werden.' })
        }
      })
  }, [token])

  const audioTracks = (data?.tracks ?? []).filter((t) => t.kind === 'track')

  function playTrack(track: PublicPlaylistTrack) {
    const id = `pl-${token}-${track._id}`
    if (player.current?.id === id) {
      player.togglePlay()
      return
    }
    const startIndex = audioTracks.findIndex((t) => t._id === track._id)
    player.playQueue(
      audioTracks.map((t) => ({
        id: `pl-${token}-${t._id}`,
        title: t.title,
        artist: t.artist,
        duration: t.duration ?? undefined,
        getStreamUrl: async () => (await playlistApi.publicStream(token, t._id)).streamUrl,
      })),
      Math.max(0, startIndex),
    )
  }

  async function downloadProject(track: PublicPlaylistTrack) {
    try {
      const res = await playlistApi.publicProject(token, track._id)
      window.location.assign(res.url)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Download fehlgeschlagen')
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center px-4 py-16">
      <AuroraBackground variant="auth" />

      <Link href="/" className="relative mb-8">
        <Logo className="[&_span]:text-xl" />
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass relative w-full max-w-lg rounded-3xl p-6 shadow-(--elevate-3)"
      >
        {error ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            {error.needsLogin && (
              <Link
                href={`/login?next=${encodeURIComponent(`/playlist/${token}`)}`}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Einloggen
              </Link>
            )}
          </div>
        ) : !data ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/30 to-accent/20">
                {data.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.coverUrl} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <Music className="size-6 text-foreground/40" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  Playlist
                </p>
                <h1 className="truncate text-xl font-semibold">{data.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {data.trackCount} {data.trackCount === 1 ? 'Track' : 'Tracks'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border">
              {(data.tracks ?? []).map((t) => {
                const isProject = t.kind === 'project'
                const playing = player.current?.id === `pl-${token}-${t._id}` && player.isPlaying
                return (
                  <div key={t._id} className="flex items-center gap-3 bg-card/40 px-3 py-2.5">
                    {isProject ? (
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/25 to-accent/15">
                        <FileArchive className="size-4 text-foreground/50" />
                      </div>
                    ) : (
                      <button
                        onClick={() => playTrack(t)}
                        aria-label={playing ? 'Pause' : 'Abspielen'}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/25 to-accent/15"
                      >
                        {playing ? (
                          <Pause className="size-4" />
                        ) : (
                          <Play className="size-4 translate-x-px" />
                        )}
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {isProject
                          ? 'Projekt'
                          : [
                              t.artist || 'Unbekannter Interpret',
                              t.bpm ? `${t.bpm} BPM` : null,
                              t.musicalKey || null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                      </p>
                    </div>
                    {!isProject && t.duration != null && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatTime(t.duration)}
                      </span>
                    )}
                    {data.canDownload && t.hasProject && (
                      <button
                        onClick={() => downloadProject(t)}
                        aria-label="Projekt herunterladen"
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Download className="size-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            <AddToLibraryButton token={token} type="playlist" />
          </>
        )}
      </motion.div>

      <p className="relative mt-6 text-sm text-muted-foreground">
        Geteilt über <span className="font-medium text-foreground">music</span>
      </p>
    </main>
  )
}
