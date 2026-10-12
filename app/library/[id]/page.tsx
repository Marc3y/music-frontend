'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ImagePlus, Music, Pencil, Share2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { RequireAuth } from '@/components/app/require-auth'
import { AppNav } from '@/components/app/app-nav'
import { AuroraBackground } from '@/components/aurora-background'
import { TrackUploader, type TrackUploaderHandle } from '@/components/app/track-uploader'
import {
  ReorderableTrackList,
  type ReorderableTrackListHandle,
} from '@/components/app/reorderable-track-list'
import { EditTrackDialog } from '@/components/app/edit-track-dialog'
import { ShareTrackDialog } from '@/components/app/share-track-dialog'
import { VersionsDialog } from '@/components/app/versions-dialog'
import { EditPlaylistDialog } from '@/components/app/edit-playlist-dialog'
import { PlaylistShareDialog } from '@/components/app/playlist-share-dialog'
import { ConfirmDeleteDialog } from '@/components/app/confirm-delete-dialog'
import { ImageCropDialog } from '@/components/app/image-crop-dialog'
import { CoverImage } from '@/components/ui/cover-image'
import { CollaboratorStack } from '@/components/app/collaborator-stack'
import { Reveal } from '@/components/reveal'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { playlistApi, audioApi, uploadToPresignedUrl, ApiError } from '@/lib/api'
import { usePlayer } from '@/lib/player-context'
import { useLibraryFilter } from '@/lib/use-library-filter'
import { ease, spring } from '@/lib/motion'
import { useT } from '@/lib/i18n/context'
import type { AudioFile, Playlist } from '@/lib/types'

function mergeVisibleOrder(full: AudioFile[], visible: AudioFile[]): AudioFile[] {
  const visibleIds = new Set(visible.map((t) => t._id))
  let vi = 0
  return full.map((t) => (visibleIds.has(t._id) ? visible[vi++] : t))
}

function hasSelectedProject(t: AudioFile): boolean {
  return !!t.versions?.find((v) => v._id === t.selectedVersionId)?.projectFilename
}

function countsAsProject(t: AudioFile): boolean {
  return (t.kind ?? 'track') === 'project' || hasSelectedProject(t)
}

const POLL_INTERVAL = 4000

export default function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const t = useT()
  const router = useRouter()
  const player = usePlayer()

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [tracks, setTracks] = useState<AudioFile[] | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [editPlaylistOpen, setEditPlaylistOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [deletePlaylistOpen, setDeletePlaylistOpen] = useState(false)
  const [editingTrack, setEditingTrack] = useState<AudioFile | null>(null)
  const [sharingTrack, setSharingTrack] = useState<AudioFile | null>(null)
  const [versionsTrack, setVersionsTrack] = useState<AudioFile | null>(null)

  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [savingName, setSavingName] = useState(false)
  const [coverZoom, setCoverZoom] = useState(false)
  const [pendingCover, setPendingCover] = useState<File | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [filter, setFilter] = useLibraryFilter()

  const [highlightTrackId, setHighlightTrackId] = useState<string | null>(null)
  const wantTrackRef = useRef<string | null>(null)
  const trackListRef = useRef<ReorderableTrackListHandle>(null)

  const isOwner = playlist?.role !== 'collaborator'

  const playerRef = useRef(player)
  playerRef.current = player
  const tracksRef = useRef(tracks)
  tracksRef.current = tracks
  const playlistRef = useRef(playlist)
  playlistRef.current = playlist

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
        toast.error(err instanceof ApiError ? err.message : t('toast.loadFailed'))
      }
    }
  }, [id])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    try {
      const want = new URLSearchParams(window.location.search).get('track')
      if (want) wantTrackRef.current = want
    } catch {

    }
  }, [])

  useEffect(() => {
    const want = wantTrackRef.current
    if (!want || !tracks) return
    if (!tracks.some((tr) => tr._id === want)) return
    wantTrackRef.current = null

    const timer = setTimeout(() => {
      trackListRef.current?.scrollToTrack(want)
      setHighlightTrackId(want)
      setTimeout(() => setHighlightTrackId(null), 2600)
      try {
        router.replace(`/library/${id}`, { scroll: false })
      } catch {

      }
    }, 120)
    return () => clearTimeout(timer)
  }, [tracks, id, router])

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

      }
    }, POLL_INTERVAL)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [tracks, id])

  function handleUploaded(track: AudioFile) {

    setTracks((prev) => [...(prev ?? []), track])
  }

  const handleTrackDeleted = useCallback((trackId: string) => {
    setTracks((prev) => (prev ?? []).filter((t) => t._id !== trackId))
  }, [])

  const handleTrackUpdated = useCallback((updated: AudioFile) => {
    setTracks((prev) =>
      (prev ?? []).map((t) => (t._id === updated._id ? { ...t, ...updated } : t)),
    )
    setVersionsTrack((prev) => (prev && prev._id === updated._id ? { ...prev, ...updated } : prev))
    setSharingTrack((prev) => (prev && prev._id === updated._id ? { ...prev, ...updated } : prev))
    setEditingTrack((prev) => (prev && prev._id === updated._id ? { ...prev, ...updated } : prev))

    playerRef.current.patchTrack(updated._id, {
      title: updated.title,
      artist: updated.artist,
      coverUrl: updated.coverUrl || playlistRef.current?.coverUrl || null,
    })
  }, [])

  function handlePlaylistUpdated(updated: Playlist) {
    setPlaylist(updated)

    for (const track of tracks ?? []) {
      if (!track.coverKey) {
        player.patchTrack(track._id, { coverUrl: updated.coverUrl || null })
      }
    }
  }

  async function handleRemoveCollaborator(username: string) {
    if (!playlist) return
    const remaining = (playlist.collaborators ?? [])
      .map((c) => c.username)
      .filter((u) => u !== username)
    const res = await playlistApi.setCollaborators(playlist._id, remaining)
    handlePlaylistUpdated({
      ...playlist,
      collabToken: res.collabToken ?? undefined,
      collaborators: res.collaborators.map((c) => ({
        username: c.username,
        userId: c.joined ? 'joined' : undefined,
      })),
      activeCollaborators: (playlist.activeCollaborators ?? []).filter(
        (u) => u.username !== username,
      ),
    })
    toast.success(t('toast.memberRemoved', { username }))
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
      toast.error(err instanceof ApiError ? err.message : t('toast.renameFailed'))
    } finally {
      setSavingName(false)
    }
  }

  function handleCoverSelect(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('toast.pickImageFile'))
      return
    }
    setPendingCover(file)
  }

  function handleCoverClick() {
    setCoverZoom((z) => !z)
  }

  async function handleCoverCropped(blob: Blob) {
    if (!playlist) return
    const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' })
    try {
      const { uploadUrl } = await playlistApi.coverUploadUrl(playlist._id, {
        filename: file.name,
        contentType: file.type,
      })
      await uploadToPresignedUrl(uploadUrl, file, file.type)
      handlePlaylistUpdated({ ...playlist, coverUrl: URL.createObjectURL(file) })
      toast.success(t('toast.coverUpdated'))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('toast.coverUploadFailed'))
    }
  }

  const playTrack = useCallback((track: AudioFile) => {

    const readyTracks = (tracksRef.current ?? []).filter(
      (t) => t.status === 'ready' && (t.kind ?? 'track') !== 'project',
    )
    const startIndex = readyTracks.findIndex((t) => t._id === track._id)
    if (startIndex === -1) return

    if (playerRef.current.current?.id === track._id) {
      playerRef.current.togglePlay()
      return
    }

    playerRef.current.playQueue(
      readyTracks.map((t) => ({
        id: t._id,
        title: t.title,
        artist: t.artist,
        coverUrl: t.coverUrl || playlistRef.current?.coverUrl || null,
        duration: t.duration,
        getStreamUrl: async () => {
          const res = await audioApi.stream(t._id)
          return res.streamUrl
        },
        onListened: () => audioApi.logListen(t._id).catch(() => {}),
      })),
      startIndex,
    )
  }, [])

  async function handleDeletePlaylist() {
    try {
      await playlistApi.remove(id)
      toast.success(t('toast.playlistDeleted'))
      router.push('/library')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('toast.deleteFailed'))
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
          <p className="text-lg font-medium">{t('playlistPage.notFound')}</p>
          <Button render={<Link href="/library" />}>{t('playlistPage.backButton')}</Button>
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
        <AuroraBackground variant="page" />

        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none fixed inset-0 z-[65] flex items-center justify-center bg-background/70 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.94, y: 8 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 8 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                className="glass flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/60 px-12 py-10 text-center shadow-(--elevate-3)"
              >
                <Upload className="size-8 text-primary" />
                <p className="font-medium">{t('playlistPage.dropHere')}</p>
                <p className="text-sm text-muted-foreground">{t('playlistPage.dropHint')}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {coverZoom && playlist && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: ease.apple }}
              onClick={() => setCoverZoom(false)}
              className="fixed inset-0 z-[70] flex cursor-zoom-out items-center justify-center bg-black/40 p-8 dark:bg-black/65"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.32, ease: ease.apple }}
                className="relative aspect-square w-[min(80vw,32rem)] overflow-hidden rounded-2xl bg-muted shadow-(--elevate-3)"
              >
                {playlist.coverUrl ? (
                  <CoverImage src={playlist.coverUrl} alt="" sizes="min(80vw, 512px)" />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <Music className="size-16 text-foreground/40" />
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative isolate">
          <AppNav />

          <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
            <Reveal>
            <Link
              href="/library"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              {t('playlistPage.backToLibrary')}
            </Link>

            {!playlist ? (
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
                <Skeleton className="size-36 shrink-0 rounded-xl sm:size-48" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 pb-10 sm:flex-row sm:items-end sm:gap-8">
                {(() => {
                  const coverInner = playlist.coverUrl ? (
                    <CoverImage
                      src={playlist.coverUrl}
                      alt=""
                      sizes="(min-width: 640px) 160px, 128px"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Music className="size-10 text-foreground/40" />
                    </div>
                  )
                  const coverClassName =
                    'group/cover relative aspect-square size-36 shrink-0 cursor-zoom-in overflow-hidden rounded-xl bg-muted shadow-(--elevate-2) transition-transform duration-200 ease-out select-none after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:ring-1 after:ring-foreground/8 after:ring-inset active:scale-[0.98] sm:size-48'

                  if (!isOwner) {
                    return (
                      <motion.div
                        onClick={handleCoverClick}
                        className={coverClassName}
                      >
                        {coverInner}
                      </motion.div>
                    )
                  }

                  return (
                    <ContextMenu>
                      <ContextMenuTrigger
                        render={
                          <motion.div
                            onClick={handleCoverClick}
                            className={coverClassName}
                          />
                        }
                      >
                        {coverInner}
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => coverInputRef.current?.click()}>
                          <ImagePlus className="size-4" />
                          {t('playlistPage.changeCover')}
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  )
                })()}
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
                <div className="flex flex-1 flex-wrap items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="eyebrow">
                      {t('playlistPage.playlistKicker')}
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
                        className="mt-2 w-full max-w-md bg-transparent p-0 text-[1.875rem] leading-tight font-semibold tracking-[-0.025em] outline-none focus:outline-none focus-visible:ring-0 sm:text-[2.5rem]"
                      />
                    ) : (
                      <h1
                        onDoubleClick={() => setNameDraft(playlist.name)}
                        className="mt-2 text-[1.875rem] leading-tight font-semibold tracking-[-0.025em] text-balance sm:text-[2.5rem]"
                      >
                        {playlist.name}
                        {savingName && (
                          <span className="ml-2 text-sm font-normal text-muted-foreground">
                            {t('playlistPage.savingName')}
                          </span>
                        )}
                      </h1>
                    )}
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {(() => {
                        const ts = tracks ?? []
                        const audio = ts.filter((x) => (x.kind ?? 'track') !== 'project').length
                        const projects = ts.filter(countsAsProject).length
                        const versions = ts.reduce((s, x) => s + (x.versions?.length ?? 0), 0)
                        const trackStr =
                          audio === 1
                            ? t('playlistPage.trackCountOne')
                            : t('playlistPage.trackCountOther', { count: audio })
                        const versionStr =
                          versions === 1
                            ? t('playlistPage.versionCountOne')
                            : t('playlistPage.versionCountOther', { count: versions })
                        const projectStr =
                          projects === 1
                            ? t('playlistPage.projectCountOne')
                            : t('playlistPage.projectCountOther', { count: projects })
                        return `${trackStr} · ${versionStr} · ${projectStr}`
                      })()}
                    </p>
                    {(playlist.activeCollaborators?.length ||
                      playlist.role === 'collaborator') && (
                      <div className="mt-3">
                        <CollaboratorStack
                          owner={playlist.ownerUser}
                          collaborators={playlist.activeCollaborators ?? []}
                          showOwner={playlist.role === 'collaborator'}
                          canRemove={isOwner}
                          onRemove={handleRemoveCollaborator}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwner && (
                      <Button variant="outline" onClick={() => setShareOpen(true)}>
                        <Share2 className="size-4" />
                        {t('common.share')}
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setEditPlaylistOpen(true)}>
                      <Pencil className="size-4" />
                      {t('common.edit')}
                    </Button>
                    {isOwner && (
                      <Button
                        variant="destructive"
                        onClick={() => setDeletePlaylistOpen(true)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            </Reveal>

            <Reveal delayIndex={1} className="mb-6 block">
              <TrackUploader
                ref={uploaderRef}
                playlistId={id}
                onUploaded={handleUploaded}
                onPatched={handleTrackUpdated}
              />
            </Reveal>

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
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                  <Music className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{t('playlistPage.emptyTitle')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('playlistPage.emptyBody')}
                  </p>
                </div>
              </div>
            ) : (
              (() => {
                const hasAudio = tracks.some((t) => (t.kind ?? 'track') !== 'project')
                const hasProjects = tracks.some(countsAsProject)
                const visibleTracks =
                  filter === 'all'
                    ? tracks
                    : tracks.filter((t) =>
                        filter === 'projects'
                          ? countsAsProject(t)
                          : (t.kind ?? 'track') !== 'project',
                      )
                return (
                  <>
                    {hasAudio && hasProjects && (
                      <div className="mb-3 flex justify-end">
                        <div className="flex gap-1 rounded-[0.6rem] bg-muted p-[3px] text-xs">
                          {(
                            [
                              ['all', t('playlistPage.filterAll')],
                              ['tracks', t('playlistPage.filterTracks')],
                              ['projects', t('playlistPage.filterProjects')],
                            ] as const
                          ).map(([value, label]) => (
                            <button
                              key={value}
                              onClick={() => setFilter(value)}
                              className={
                                'rounded-[0.45rem] px-3 py-1 font-medium transition-colors ' +
                                (filter === value
                                  ? 'bg-card text-foreground shadow-(--elevate-1) dark:bg-foreground/14'
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
                        {t('playlistPage.nothingInView')}
                      </p>
                    ) : (
                      <ReorderableTrackList
                        ref={trackListRef}
                        playlistId={id}
                        tracks={visibleTracks}
                        projectView={filter === 'projects'}
                        fallbackCoverUrl={playlist?.coverUrl}
                        currentId={player.current?.id ?? null}
                        highlightId={highlightTrackId}
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
        forceProject={filter === 'projects'}
        onOpenChange={(open) => !open && setSharingTrack(null)}
        onUpdated={handleTrackUpdated}
      />
      <VersionsDialog
        track={versionsTrack}
        open={versionsTrack !== null}
        onOpenChange={(open) => !open && setVersionsTrack(null)}
        onUpdated={handleTrackUpdated}
      />
      <PlaylistShareDialog
        playlist={playlist}
        open={shareOpen}
        onOpenChange={setShareOpen}
        onUpdated={(p) => setPlaylist(p)}
      />
      <ImageCropDialog
        file={pendingCover}
        open={pendingCover !== null}
        onOpenChange={(o) => !o && setPendingCover(null)}
        onCropped={handleCoverCropped}
      />
      {playlist && isOwner && (
        <ConfirmDeleteDialog
          open={deletePlaylistOpen}
          onOpenChange={setDeletePlaylistOpen}
          title={t('playlistPage.deletePlaylistTitle')}
          description={t('playlistPage.deletePlaylistBody', { name: playlist.name })}
          onConfirm={handleDeletePlaylist}
        />
      )}
    </RequireAuth>
  )
}
