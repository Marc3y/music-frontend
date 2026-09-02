'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Music } from 'lucide-react'
import { toast } from 'sonner'
import { RequireAuth } from '@/components/app/require-auth'
import { AppNav } from '@/components/app/app-nav'
import { PlaylistCard } from '@/components/app/playlist-card'
import { CreatePlaylistDialog } from '@/components/app/create-playlist-dialog'
import { UsageBar } from '@/components/app/usage-bar'
import { SharedItemsList } from '@/components/app/shared-items-list'
import { Skeleton } from '@/components/ui/skeleton'
import { Reveal } from '@/components/reveal'
import { accountApi, playlistApi, ApiError } from '@/lib/api'
import type { Playlist, SavedShare, StorageSummary } from '@/lib/types'

type Tab = 'own' | 'shared' | 'collab'

function PlaylistGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {children}
    </div>
  )
}

export default function LibraryPage() {
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null)
  const [storage, setStorage] = useState<StorageSummary | null>(null)
  const [saved, setSaved] = useState<SavedShare[]>([])
  const [tab, setTab] = useState<Tab>('own')

  useEffect(() => {
    playlistApi
      .list()
      .then(setPlaylists)
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : 'Playlists konnten nicht geladen werden')
        setPlaylists([])
      })
    accountApi.storage().then(setStorage).catch(() => setStorage(null))
    accountApi.savedShares().then(setSaved).catch(() => setSaved([]))
  }, [])

  const items = useMemo(
    () => saved.filter((s) => s.type === 'audio' || s.type === 'project'),
    [saved],
  )
  const sharedPlaylists = useMemo(() => saved.filter((s) => s.type === 'playlist'), [saved])
  const collabPlaylists = useMemo(() => saved.filter((s) => s.type === 'collab'), [saved])

  const hasShared = items.length + sharedPlaylists.length > 0
  const hasCollab = collabPlaylists.length > 0

  // Falls der aktive Tab wegfällt → zurück auf "own"
  useEffect(() => {
    if ((tab === 'shared' && !hasShared) || (tab === 'collab' && !hasCollab)) setTab('own')
  }, [tab, hasShared, hasCollab])

  const storageWarning =
    storage && storage.limit > 0 && storage.used / storage.limit > 0.8

  function handleCreated(playlist: Playlist) {
    setPlaylists((prev) => [playlist, ...(prev ?? [])])
  }

  function removeSaved(id: string) {
    void accountApi.removeSavedShare(id).catch(() => {})
    setSaved((prev) => prev.filter((s) => s._id !== id))
  }

  const tabs: [Tab, string][] = [
    ['own', 'Meine Playlists'],
    ...(hasShared ? ([['shared', `Von anderen (${items.length + sharedPlaylists.length})`]] as [Tab, string][]) : []),
    ...(hasCollab ? ([['collab', `Collaboration (${collabPlaylists.length})`]] as [Tab, string][]) : []),
  ]

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
              {tab === 'own' && <CreatePlaylistDialog onCreated={handleCreated} />}
            </div>

            {tabs.length > 1 && (
              <div className="mb-6 flex gap-1 rounded-xl bg-muted/60 p-1 text-sm sm:w-fit">
                {tabs.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setTab(value)}
                    className={
                      'flex-1 rounded-lg px-3 py-1.5 font-medium transition-colors sm:flex-none ' +
                      (tab === value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground')
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {tab === 'collab' ? (
              <PlaylistGrid>
                {collabPlaylists.map((s) => (
                  <PlaylistCard
                    key={s._id}
                    playlist={{ _id: s.playlistId ?? s._id, name: s.title, coverUrl: s.coverUrl }}
                    href={`/library/${s.playlistId}`}
                    badge={`Mitglied · ${s.trackCount ?? 0} Tracks`}
                    onRemove={() => removeSaved(s._id)}
                  />
                ))}
              </PlaylistGrid>
            ) : tab === 'shared' ? (
              <div className="flex flex-col gap-6">
                {sharedPlaylists.length > 0 && (
                  <PlaylistGrid>
                    {sharedPlaylists.map((s) => (
                      <PlaylistCard
                        key={s._id}
                        playlist={{ _id: s._id, name: s.title, coverUrl: s.coverUrl }}
                        href={`/playlist/${s.token}`}
                        badge={`Geteilt · ${s.trackCount ?? 0} Tracks`}
                        onRemove={() => removeSaved(s._id)}
                      />
                    ))}
                  </PlaylistGrid>
                )}
                {items.length > 0 && (
                  <SharedItemsList
                    items={items}
                    onRemoved={(id) => setSaved((prev) => prev.filter((s) => s._id !== id))}
                  />
                )}
              </div>
            ) : (
              <>
                {storageWarning && storage && (
                  <Link
                    href="/usage"
                    className="mb-8 flex flex-col gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 transition-colors hover:bg-amber-500/10"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">
                        Dein Speicher ist zu {Math.round((storage.used / storage.limit) * 100)} % voll
                      </span>
                      <span className="text-xs text-muted-foreground">Speicher verwalten →</span>
                    </div>
                    <UsageBar used={storage.used} limit={storage.limit} />
                  </Link>
                )}

                {playlists === null ? (
                  <PlaylistGrid>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex flex-col gap-3 p-2">
                        <Skeleton className="aspect-square w-full rounded-xl" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ))}
                  </PlaylistGrid>
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
                  <PlaylistGrid>
                    {playlists.map((playlist, i) => (
                      <Reveal key={playlist._id} delayIndex={i % 10}>
                        <PlaylistCard playlist={playlist} />
                      </Reveal>
                    ))}
                  </PlaylistGrid>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </RequireAuth>
  )
}
