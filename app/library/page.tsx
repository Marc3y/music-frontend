'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Music } from 'lucide-react'
import { RequireAuth } from '@/components/app/require-auth'
import { AppNav } from '@/components/app/app-nav'
import { AuroraBackground } from '@/components/aurora-background'
import { toast } from 'sonner'
import { PlaylistCard } from '@/components/app/playlist-card'
import { ReorderablePlaylistGrid } from '@/components/app/reorderable-playlist-grid'
import { CreatePlaylistDialog } from '@/components/app/create-playlist-dialog'
import { EditPlaylistDialog } from '@/components/app/edit-playlist-dialog'
import { PlaylistShareDialog } from '@/components/app/playlist-share-dialog'
import { ConfirmDeleteDialog } from '@/components/app/confirm-delete-dialog'
import { UsageBar } from '@/components/app/usage-bar'
import { SharedItemsList } from '@/components/app/shared-items-list'
import { Skeleton } from '@/components/ui/skeleton'
import { Reveal } from '@/components/reveal'
import { useLibraryData } from '@/lib/use-library-data'
import { useT } from '@/lib/i18n/context'
import { accountApi, playlistApi, ApiError } from '@/lib/api'
import type { Playlist, SavedShare } from '@/lib/types'

type Tab = 'own' | 'shared' | 'collab'

function PlaylistGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {children}
    </div>
  )
}

export default function LibraryPage() {
  const t = useT()
  const { playlists, saved, storage, setPlaylists, setSaved } = useLibraryData()
  const [tab, setTab] = useState<Tab>('own')
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  const [sharingPlaylist, setSharingPlaylist] = useState<Playlist | null>(null)
  const [deletingPlaylist, setDeletingPlaylist] = useState<Playlist | null>(null)

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
    setPlaylists((prev) => [playlist, ...prev])
  }

  function handlePlaylistUpdated(updated: Playlist) {
    setPlaylists((prev) =>
      prev.map((p) =>
        p._id === updated._id
          ? { ...p, ...updated, coverUrl: updated.coverUrl ?? p.coverUrl }
          : p,
      ),
    )
  }

  async function handleDeletePlaylist() {
    if (!deletingPlaylist) return
    try {
      await playlistApi.remove(deletingPlaylist._id)
      setPlaylists((prev) => prev.filter((p) => p._id !== deletingPlaylist._id))
      toast.success(t('toast.playlistDeleted'))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('toast.deleteFailed'))
    }
  }

  function removeSaved(id: string) {
    void accountApi.removeSavedShare(id).catch(() => {})
    setSaved((prev) => prev.filter((s) => s._id !== id))
  }

  function reorderOwn(next: Playlist[]) {
    setPlaylists(() => next)
  }
  function persistOwn(orderedIds: string[]) {
    void playlistApi.reorder(orderedIds).catch((err) => {
      toast.error(err instanceof ApiError ? err.message : t('toast.reorderFailed'))
    })
  }

  // Reordered subset (one saved-share type) merged back into the full `saved` list.
  function reorderSavedSubset(subsetType: 'playlist' | 'collab', next: SavedShare[]) {
    setSaved((prev) => {
      let i = 0
      return prev.map((s) => (s.type === subsetType ? next[i++] : s))
    })
  }
  function persistSaved(orderedIds: string[]) {
    void accountApi.reorderSavedShares(orderedIds).catch((err) => {
      toast.error(err instanceof ApiError ? err.message : t('toast.reorderFailed'))
    })
  }

  const tabs: [Tab, string][] = [
    ['own', t('library.tabOwn')],
    ...(hasShared
      ? ([['shared', t('library.tabShared', { count: items.length + sharedPlaylists.length })]] as [Tab, string][])
      : []),
    ...(hasCollab
      ? ([['collab', t('library.tabCollab', { count: collabPlaylists.length })]] as [Tab, string][])
      : []),
  ]

  return (
    <RequireAuth>
      <div className="relative min-h-dvh pb-32">
        <AuroraBackground variant="page" />

        <div className="relative isolate">
          <AppNav />

          <main className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4 pb-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-balance">
                  {t('library.title')}
                </h1>
                <p className="mt-1 text-muted-foreground">{t('library.subtitle')}</p>
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
                      'relative flex-1 rounded-lg px-3 py-1.5 font-medium transition-colors sm:flex-none ' +
                      (tab === value
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground')
                    }
                  >
                    {tab === value && (
                      <motion.span
                        layoutId="library-tab"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        className="absolute inset-0 -z-10 rounded-lg bg-background shadow-sm"
                      />
                    )}
                    {label}
                  </button>
                ))}
              </div>
            )}

            {tab === 'collab' ? (
              <ReorderablePlaylistGrid
                items={collabPlaylists}
                onOrderChange={(next) => reorderSavedSubset('collab', next)}
                onPersist={persistSaved}
                renderItem={(s) => (
                  <PlaylistCard
                    playlist={{ _id: s.playlistId ?? s._id, name: s.title, coverUrl: s.coverUrl }}
                    href={`/library/${s.playlistId}`}
                    badge={t('library.badgeMember', { count: s.trackCount ?? 0 })}
                    onRemove={() => removeSaved(s._id)}
                  />
                )}
              />
            ) : tab === 'shared' ? (
              <div className="flex flex-col gap-6">
                {sharedPlaylists.length > 0 && (
                  <ReorderablePlaylistGrid
                    items={sharedPlaylists}
                    onOrderChange={(next) => reorderSavedSubset('playlist', next)}
                    onPersist={persistSaved}
                    renderItem={(s) => (
                      <PlaylistCard
                        playlist={{ _id: s._id, name: s.title, coverUrl: s.coverUrl }}
                        href={`/playlist/${s.token}`}
                        badge={t('library.badgeShared', { count: s.trackCount ?? 0 })}
                        onRemove={() => removeSaved(s._id)}
                      />
                    )}
                  />
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
                        {t('library.storageWarning', {
                          percent: Math.round((storage.used / storage.limit) * 100),
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('library.manageStorage')}
                      </span>
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
                        <p className="font-medium">{t('library.emptyTitle')}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t('library.emptyBody')}
                        </p>
                      </div>
                      <CreatePlaylistDialog onCreated={handleCreated} />
                    </div>
                  </Reveal>
                ) : (
                  <ReorderablePlaylistGrid
                    items={playlists}
                    onOrderChange={reorderOwn}
                    onPersist={persistOwn}
                    renderItem={(playlist) => (
                      <PlaylistCard
                        playlist={playlist}
                        collaboratorCount={playlist.collaborators?.length ?? 0}
                        onEdit={() => setEditingPlaylist(playlist)}
                        onShare={() => setSharingPlaylist(playlist)}
                        onDelete={() => setDeletingPlaylist(playlist)}
                      />
                    )}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <EditPlaylistDialog
        playlist={editingPlaylist}
        open={editingPlaylist !== null}
        onOpenChange={(o) => !o && setEditingPlaylist(null)}
        onUpdated={(p) => {
          handlePlaylistUpdated(p)
          setEditingPlaylist(null)
        }}
      />
      <PlaylistShareDialog
        playlist={sharingPlaylist}
        open={sharingPlaylist !== null}
        onOpenChange={(o) => !o && setSharingPlaylist(null)}
        onUpdated={(p) => {
          handlePlaylistUpdated(p)
          setSharingPlaylist((prev) => (prev && prev._id === p._id ? p : prev))
        }}
      />
      <ConfirmDeleteDialog
        open={deletingPlaylist !== null}
        onOpenChange={(o) => !o && setDeletingPlaylist(null)}
        title={t('playlistPage.deletePlaylistTitle')}
        description={
          deletingPlaylist
            ? t('playlistPage.deletePlaylistBody', { name: deletingPlaylist.name })
            : ''
        }
        onConfirm={handleDeletePlaylist}
      />
    </RequireAuth>
  )
}
