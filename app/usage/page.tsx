'use client'

import { useEffect, useState } from 'react'
import { HardDrive, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { RequireAuth } from '@/components/app/require-auth'
import { AppNav } from '@/components/app/app-nav'
import { UsageBar } from '@/components/app/usage-bar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { accountApi, audioApi, ApiError } from '@/lib/api'
import { formatBytes } from '@/lib/format'
import type { UsageInfo, UsageTrack } from '@/lib/types'

const SKIP_CONFIRM_KEY = 'music.usage.skipDeleteConfirm'

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UsageTrack | null>(null)
  const [dontAskAgain, setDontAskAgain] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    accountApi
      .usage()
      .then(setUsage)
      .catch((err) => {
        toast.error(
          err instanceof ApiError ? err.message : 'Speichernutzung konnte nicht geladen werden',
        )
        setUsage({ used: 0, limit: 0, tracks: [] })
      })
  }, [])

  function skipConfirm() {
    try {
      return localStorage.getItem(SKIP_CONFIRM_KEY) === '1'
    } catch {
      return false
    }
  }

  async function deleteNow(track: UsageTrack) {
    setDeletingId(track._id)
    try {
      await audioApi.remove(track._id)
      setUsage((prev) =>
        prev
          ? {
              ...prev,
              used: Math.max(0, prev.used - track.fileSize),
              tracks: prev.tracks.filter((t) => t._id !== track._id),
            }
          : prev,
      )
      toast.success(`"${track.title}" gelöscht`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Löschen fehlgeschlagen')
    } finally {
      setDeletingId(null)
    }
  }

  function handleDeleteClick(track: UsageTrack) {
    if (skipConfirm()) {
      void deleteNow(track)
    } else {
      setDontAskAgain(false)
      setDeleteTarget(track)
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return
    if (dontAskAgain) {
      try {
        localStorage.setItem(SKIP_CONFIRM_KEY, '1')
      } catch {
        // ignore
      }
    }
    const target = deleteTarget
    setDeleteTarget(null)
    void deleteNow(target)
  }

  const overLimit = usage && usage.limit > 0 && usage.used >= usage.limit

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

          <main className="mx-auto max-w-3xl px-4 pt-4 sm:px-6">
            <div className="pb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-balance">
                Speichernutzung
              </h1>
              <p className="mt-1 text-muted-foreground">
                Dein belegter Speicher und deine größten Tracks.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-xl">
              {usage === null ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <HardDrive className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {formatBytes(usage.used)} von {formatBytes(usage.limit)} belegt
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {overLimit
                          ? 'Limit erreicht – lösche Tracks, um wieder hochladen zu können.'
                          : `${formatBytes(Math.max(0, usage.limit - usage.used))} frei`}
                      </p>
                    </div>
                  </div>
                  <UsageBar used={usage.used} limit={usage.limit} className="mt-4" />
                </>
              )}
            </div>

            <h2 className="mt-8 mb-3 text-sm font-medium text-muted-foreground">
              Tracks nach Größe
            </h2>

            {usage === null ? (
              <div className="flex flex-col gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-2 py-2">
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : usage.tracks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                Noch keine Tracks hochgeladen.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border">
                {usage.tracks.map((track) => (
                  <div
                    key={track._id}
                    className="flex items-center gap-3 bg-card/40 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{track.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {track.playlistName ?? 'Ohne Playlist'}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm tabular-nums">
                      {formatBytes(track.fileSize)}
                    </span>
                    <button
                      onClick={() => handleDeleteClick(track)}
                      disabled={deletingId === track._id}
                      aria-label={`"${track.title}" löschen`}
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                    >
                      {deletingId === track._id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Track löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.title}" (${formatBytes(deleteTarget.fileSize)}) wird unwiderruflich gelöscht.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="size-4 accent-primary"
            />
            Nicht mehr anzeigen (nur auf dieser Seite)
          </label>

          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RequireAuth>
  )
}
