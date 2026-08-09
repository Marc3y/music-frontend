'use client'

import { useEffect, useState } from 'react'
import { Music } from 'lucide-react'
import { toast } from 'sonner'
import { RequireAuth } from '@/components/app/require-auth'
import { AppNav } from '@/components/app/app-nav'
import { PlaylistCard } from '@/components/app/playlist-card'
import { CreatePlaylistDialog } from '@/components/app/create-playlist-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Reveal } from '@/components/reveal'
import { playlistApi, ApiError } from '@/lib/api'
import type { Playlist } from '@/lib/types'

export default function LibraryPage() {
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null)

  useEffect(() => {
    playlistApi
      .list()
      .then(setPlaylists)
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : 'Playlists konnten nicht geladen werden')
        setPlaylists([])
      })
  }, [])

  function handleCreated(playlist: Playlist) {
    setPlaylists((prev) => [playlist, ...(prev ?? [])])
  }

  return (
    <RequireAuth>
      <div className="relative min-h-dvh pb-32">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[400px]"
          style={{
            background:
              'radial-gradient(70% 60% at 50% 0%, oklch(0.55 0.27 295 / 0.18), transparent 70%)',
          }}
        />

        <div className="relative">
          <AppNav />

          <main className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4 pb-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-balance">
                  Deine Mediathek
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Alle deine Playlists an einem Ort.
                </p>
              </div>
              <CreatePlaylistDialog onCreated={handleCreated} />
            </div>

            {playlists === null ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-3 p-2">
                    <Skeleton className="aspect-square w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : playlists.length === 0 ? (
              <Reveal>
                <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border py-24 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                    <Music className="size-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Noch keine Playlists</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Erstelle deine erste Playlist, um Tracks hochzuladen.
                    </p>
                  </div>
                  <CreatePlaylistDialog onCreated={handleCreated} />
                </div>
              </Reveal>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {playlists.map((playlist, i) => (
                  <Reveal key={playlist._id} delayIndex={i % 10}>
                    <PlaylistCard playlist={playlist} />
                  </Reveal>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </RequireAuth>
  )
}
