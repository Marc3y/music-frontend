'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ImagePlus, Music, Pencil, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { RequireAuth } from '@/components/app/require-auth'
import { AppNav } from '@/components/app/app-nav'
import { TrackUploader, type TrackUploaderHandle } from '@/components/app/track-uploader'
import { ReorderableTrackList } from '@/components/app/reorderable-track-list'
import { EditTrackDialog } from '@/components/app/edit-track-dialog'
import { ShareTrackDialog } from '@/components/app/share-track-dialog'
import { VersionsDialog } from '@/components/app/versions-dialog'
import { EditPlaylistDialog } from '@/components/app/edit-playlist-dialog'
import { ConfirmDeleteDialog } from '@/components/app/confirm-delete-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { playlistApi, audioApi, uploadToPresignedUrl, ApiError } from '@/lib/api'
import { usePlayer } from '@/lib/player-context'
import { useLibraryFilter } from '@/lib/use-library-filter'
import type { AudioFile, Playlist } from '@/lib/types'

// Neue sichtbare Reihenfolge in die volle Liste zurückmergen (versteckte behalten Position)
function mergeVisibleOrder(full: AudioFile[], visible: AudioFile[]): AudioFile[] {
  const visibleIds = new Set(visible.map((t) => t._id))
  let vi = 0
  return full.map((t) => (visibleIds.has(t._id) ? visible[vi++] : t))
}

const POLL_INTERVAL = 4000

export default function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const player = usePlayer()

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [tracks, setTracks] = useState<AudioFile[] | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [editPlaylistOpen, setEditPlaylistOpen] = useState(false)
  const [deletePlaylistOpen, setDeletePlaylistOpen] = useState(false)
  const [editingTrack, setEditingTrack] = useState<AudioFile | null>(null)
  const [sharingTrack, setSharingTrack] = useState<AudioFile | null>(null)
  const [versionsTrack, setVersionsTrack] = useState<AudioFile | null>(null)

  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [savingName, setSavingName] = useState(false)
  const [coverEditing, setCoverEditing] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [filter, setFilter] = useLibraryFilter()

  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)
  const uploaderRef = useRef<TrackUploaderHandle>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadAll = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([
        playlistApi.get(id),
        audioApi.listByPlaylist(id),
      ])
      setPlaylist(p)
      setTracks(t)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true)
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Laden fehlgeschlagen')
      }
    }
  }, [id])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Poll while any track is still being processed
  useEffect(() => {
    const hasProcessing = tracks?.some((t) => t.status === 'processing')
    if (!hasProcessing) {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }
    pollRef.current = setInterval(async () => {
      try {
        const fresh = await audioApi.listByPlaylist(id)
        setTracks(fresh)
      } catch {
        // silent retry on next tick
      }
    }, POLL_INTERVAL)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [tracks, id])

  function handleUploaded(track: AudioFile) {
    // New uploads are appended at the end, matching how the backend orders them.
    setTracks((prev) => [...(prev ?? []), track])
  }

  function handleTrackDeleted(trackId: string) {
    setTracks((prev) => (prev ?? []).filter((t) => t._id !== trackId))
  }

  function handleTrackUpdated(updated: AudioFile) {
    setTracks((prev) =>
      (prev ?? []).map((t) => (t._id === updated._id ? { ...t, ...updated } : t)),
    )
    setVersionsTrack((prev) => (prev && prev._id === updated._id ? { ...prev, ...updated } : prev))
    setSharingTrack((prev) => (prev && prev._id === updated._id ? { ...prev, ...updated } : prev))
    setEditingTrack((prev) => (prev && prev._id === updated._id ? { ...prev, ...updated } : prev))
    // Reflect the change live in the player if this track is currently queued,
    // without restarting playback.
    player.patchTrack(updated._id, {
      title: updated.title,
      artist: updated.artist,
      coverUrl: updated.coverUrl || playlist?.coverUrl || null,
    })
  }

  function handlePlaylistUpdated(updated: Playlist) {
    setPlaylist(updated)
    // Any queued track that has no own cover falls back to the playlist cover -
    // patch those live in the player so a cover change shows immediately.
    for (const track of tracks ?? []) {
      if (!track.coverKey) {
        player.patchTrack(track._id, { coverUrl: updated.coverUrl || null })
      }
    }
  }

  async function commitName() {
    if (nameDraft === null || !playlist) return
    const next = nameDraft.trim()
    setNameDraft(null)
    if (!next || next === playlist.name) return
    setSavingName(true)
    try {
      const updated = await playlistApi.update(playlist._id, next)
      handlePlaylistUpdated({ ...updated, coverUrl: playlist.coverUrl })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Umbenennen fehlgeschlagen')
    } finally {
      setSavingName(false)
    }
  }

  async function handleCoverSelect(file: File | undefined) {
    if (!file || !playlist) return
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte eine Bilddatei auswählen')
      return
    }
    setCoverEditing(false)
    try {
      const { uploadUrl } = await playlistApi.coverUploadUrl(playlist._id, {
        filename: file.name,
        contentType: file.type,
      })
      await uploadToPresignedUrl(uploadUrl, file, file.type)
      handlePlaylistUpdated({ ...playlist, coverUrl: URL.createObjectURL(file) })
      toast.success('Cover aktualisiert')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Cover-Upload fehlgeschlagen')
    }
  }

  function playTrack(track: AudioFile) {
    // Reine Projekt-Einträge werden bei der Wiedergabe ignoriert
    const readyTracks = (tracks ?? []).filter(
      (t) => t.status === 'ready' && (t.kind ?? 'track') !== 'project',
    )
    const startIndex = readyTracks.findIndex((t) => t._id === track._id)
    if (startIndex === -1) return

    if (player.current?.id === track._id) {
      player.togglePlay()
      return
    }

    player.playQueue(
      readyTracks.map((t) => ({
        id: t._id,
        title: t.title,
        artist: t.artist,
        coverUrl: t.coverUrl || playlist?.coverUrl || null,
        duration: t.duration,
        getStreamUrl: async () => {
          const res = await audioApi.stream(t._id)
          return res.streamUrl
        },
      })),
      startIndex,
    )
  }

  async function handleDeletePlaylist() {
    try {
      await playlistApi.remove(id)
      toast.success('Playlist gelöscht')
      router.push('/library')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Löschen fehlgeschlagen')
    }
  }

  function onDragEnter(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes('Files')) return
    e.preventDefault()
    dragCounter.current += 1
    setIsDragOver(true)
  }

  function onDragOver(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes('Files')) return
    e.preventDefault()
  }

  function onDragLeave(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes('Files')) return
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragOver(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
    uploaderRef.current?.handleFiles(e.dataTransfer.files)
  }

  if (notFound) {
    return (
      <RequireAuth>
        <AppNav />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-24 text-center">
          <p className="text-lg font-medium">Playlist nicht gefunden</p>
          <Button render={<Link href="/library" />}>Zurück zur Mediathek</Button>
        </div>
      </RequireAuth>
    )
  }

  return (
    <RequireAuth>
      <div
        className="relative min-h-dvh pb-32"
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[400px]"
          style={{
            background:
              'radial-gradient(70% 60% at 50% 0%, oklch(0.55 0.27 295 / 0.18), transparent 70%)',
          }}
        />

        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none fixed inset-0 z-[65] flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-primary/60 bg-card/80 px-12 py-10 text-center">
                <Upload className="size-8 text-primary" />
                <p className="font-medium">Hier ablegen</p>
                <p className="text-sm text-muted-foreground">
                  Audiodateien oder Projekte (.zip/.rar) werden hinzugefügt.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <AppNav />

          <main className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
            <Link
              href="/library"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Mediathek
            </Link>

            {!playlist ? (
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
                <Skeleton className="size-32 shrink-0 rounded-2xl sm:size-40" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 pb-8 sm:flex-row sm:items-end">
                <div
                  onDoubleClick={() => setCoverEditing(true)}
                  className="relative size-32 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/25 to-accent/15 shadow-xl select-none sm:size-40"
                >
                  {playlist.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={playlist.coverUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Music className="size-10 text-foreground/40" />
                    </div>
                  )}
                  {coverEditing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-background/75 backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="flex flex-col items-center gap-1 text-xs font-medium"
                      >
                        <ImagePlus className="size-6" />
                        Bild wählen
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverEditing(false)}
                        aria-label="Abbrechen"
                        className="absolute top-1.5 right-1.5 rounded-md p-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  )}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      handleCoverSelect(e.target.files?.[0])
                      e.target.value = ''
                    }}
                  />
                </div>
                <div className="flex flex-1 flex-wrap items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                      Playlist
                    </p>
                    {nameDraft !== null ? (
                      <input
                        autoFocus
                        value={nameDraft}
                        maxLength={100}
                        onChange={(e) => setNameDraft(e.target.value)}
                        onBlur={commitName}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            commitName()
                          } else if (e.key === 'Escape') {
                            setNameDraft(null)
                          }
                        }}
                        className="mt-1 w-full max-w-md rounded-lg border border-input bg-background px-2 py-1 text-3xl font-semibold tracking-tight outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    ) : (
                      <h1
                        onDoubleClick={() => setNameDraft(playlist.name)}
                        title="Doppelklick zum Umbenennen"
                        className="mt-1 text-3xl font-semibold tracking-tight text-balance"
                      >
                        {playlist.name}
                        {savingName && (
                          <span className="ml-2 text-sm font-normal text-muted-foreground">
                            speichert…
                          </span>
                        )}
                      </h1>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {(() => {
                        const t = tracks ?? []
                        const audio = t.filter((x) => (x.kind ?? 'track') !== 'project').length
                        const projects = t.length - audio
                        const versions = t.reduce((s, x) => s + (x.versions?.length ?? 0), 0)
                        return `${audio} ${audio === 1 ? 'Track' : 'Tracks'} · ${versions} ${versions === 1 ? 'Version' : 'Versionen'} · ${projects} ${projects === 1 ? 'Projekt' : 'Projekte'}`
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setEditPlaylistOpen(true)}>
                      <Pencil className="size-4" />
                      Bearbeiten
                    </Button>
                    <Button variant="destructive" onClick={() => setDeletePlaylistOpen(true)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <TrackUploader
                ref={uploaderRef}
                playlistId={id}
                onUploaded={handleUploaded}
                onPatched={handleTrackUpdated}
              />
            </div>

            {tracks === null ? (
              <div className="flex flex-col gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-2 py-2">
                    <Skeleton className="size-11 rounded-lg" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border py-20 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                  <Music className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Noch nichts hier</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Lade einen Track (Audio) oder ein Projekt (.zip/.rar) hoch.
                  </p>
                </div>
              </div>
            ) : (
              (() => {
                const hasAudio = tracks.some((t) => (t.kind ?? 'track') !== 'project')
                const hasProjects = tracks.some((t) => (t.kind ?? 'track') === 'project')
                const visibleTracks =
                  filter === 'all'
                    ? tracks
                    : tracks.filter((t) =>
                        filter === 'projects'
                          ? (t.kind ?? 'track') === 'project'
                          : (t.kind ?? 'track') !== 'project',
                      )
                return (
                  <>
                    {hasAudio && hasProjects && (
                      <div className="mb-3 flex justify-end">
                        <div className="flex gap-1 rounded-xl bg-muted/60 p-1 text-xs">
                          {(
                            [
                              ['all', 'Alle'],
                              ['tracks', 'Tracks'],
                              ['projects', 'Projekte'],
                            ] as const
                          ).map(([value, label]) => (
                            <button
                              key={value}
                              onClick={() => setFilter(value)}
                              className={
                                'rounded-lg px-3 py-1 font-medium transition-colors ' +
                                (filter === value
                                  ? 'bg-background text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground')
                              }
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {visibleTracks.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                        Nichts in dieser Ansicht.
                      </p>
                    ) : (
                      <ReorderableTrackList
                        playlistId={id}
                        tracks={visibleTracks}
                        fallbackCoverUrl={playlist?.coverUrl}
                        currentId={player.current?.id ?? null}
                        isPlaying={player.isPlaying}
                        isLoading={player.isLoading}
                        onPlay={playTrack}
                        onEdit={setEditingTrack}
                        onShare={setSharingTrack}
                        onVersions={setVersionsTrack}
                        onUpdated={handleTrackUpdated}
                        onDeleted={handleTrackDeleted}
                        onChange={(reordered) =>
                          setTracks((prev) =>
                            prev ? mergeVisibleOrder(prev, reordered) : reordered,
                          )
                        }
                      />
                    )}
                  </>
                )
              })()
            )}
          </main>
        </div>
      </div>

      <EditPlaylistDialog
        playlist={playlist}
        open={editPlaylistOpen}
        onOpenChange={setEditPlaylistOpen}
        onUpdated={handlePlaylistUpdated}
      />
      <EditTrackDialog
        track={editingTrack}
        open={editingTrack !== null}
        onOpenChange={(open) => !open && setEditingTrack(null)}
        onUpdated={handleTrackUpdated}
      />
      <ShareTrackDialog
        track={sharingTrack}
        open={sharingTrack !== null}
        onOpenChange={(open) => !open && setSharingTrack(null)}
        onUpdated={handleTrackUpdated}
      />
      <VersionsDialog
        track={versionsTrack}
        open={versionsTrack !== null}
        onOpenChange={(open) => !open && setVersionsTrack(null)}
        onUpdated={handleTrackUpdated}
      />
      {playlist && (
        <ConfirmDeleteDialog
          open={deletePlaylistOpen}
          onOpenChange={setDeletePlaylistOpen}
          title="Playlist löschen?"
          description={`"${playlist.name}" und alle enthaltenen Tracks werden unwiderruflich gelöscht.`}
          onConfirm={handleDeletePlaylist}
        />
      )}
    </RequireAuth>
  )
}
