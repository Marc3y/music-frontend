'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { HardDrive, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { RequireAuth } from '@/components/app/require-auth'
import { AppNav } from '@/components/app/app-nav'
import { AuroraBackground } from '@/components/aurora-background'
import { Reveal } from '@/components/reveal'
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
import { useT } from '@/lib/i18n/context'
import { formatBytes } from '@/lib/format'
import type { UsageInfo, UsageProject, UsageTrack } from '@/lib/types'

const SKIP_CONFIRM_KEY = 'music.usage.skipDeleteConfirm'

type Tab = 'tracks' | 'projects'

type DeleteTarget =
  | { kind: 'track'; item: UsageTrack }
  | { kind: 'project'; item: UsageProject }

export default function UsagePage() {
  const tr = useT()
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [tab, setTab] = useState<Tab>('tracks')
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [dontAskAgain, setDontAskAgain] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    accountApi
      .usage()
      .then(setUsage)
      .catch((err) => {
        toast.error(
          err instanceof ApiError ? err.message : tr('usagePage.loadFailed'),
        )
        setUsage({ used: 0, limit: 0, tracks: [], projects: [] })
      })
  }, [])

  function skipConfirm() {
    try {
      return localStorage.getItem(SKIP_CONFIRM_KEY) === '1'
    } catch {
      return false
    }
  }

  async function deleteTrackNow(track: UsageTrack) {
    setDeletingId(track._id)
    try {
      await audioApi.remove(track._id)
      setUsage((prev) =>
        prev
          ? {
              ...prev,
              used: Math.max(0, prev.used - track.size),
              tracks: prev.tracks.filter((t) => t._id !== track._id),
              projects: prev.projects.filter((p) => p.trackId !== track._id),
            }
          : prev,
      )
      toast.success(tr('toast.itemDeleted', { title: track.title }))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tr('usagePage.deleteFailed'))
    } finally {
      setDeletingId(null)
    }
  }

  async function deleteProjectNow(project: UsageProject) {
    setDeletingId(project.versionId)
    try {
      await audioApi.deleteVersionProject(project.trackId, project.versionId)
      setUsage((prev) =>
        prev
          ? {
              ...prev,
              used: Math.max(0, prev.used - project.size),
              projects: prev.projects.filter((p) => p.versionId !== project.versionId),
              tracks: prev.tracks.map((t) =>
                t._id === project.trackId
                  ? { ...t, size: Math.max(0, t.size - project.size) }
                  : t,
              ),
            }
          : prev,
      )
      toast.success(tr('toast.projectFileDeleted'))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tr('usagePage.deleteFailed'))
    } finally {
      setDeletingId(null)
    }
  }

  function runDelete(target: DeleteTarget) {
    if (target.kind === 'track') void deleteTrackNow(target.item)
    else void deleteProjectNow(target.item)
  }

  function handleDeleteClick(target: DeleteTarget) {
    if (skipConfirm()) {
      runDelete(target)
    } else {
      setDontAskAgain(false)
      setDeleteTarget(target)
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
    runDelete(target)
  }

  const overLimit = usage && usage.limit > 0 && usage.used >= usage.limit

  return (
    <RequireAuth>
      <div className="relative min-h-dvh pb-32">
        <AuroraBackground variant="page" />

        <div className="relative">
          <AppNav />

          <main className="mx-auto max-w-3xl px-4 pt-4 sm:px-6">
            <Reveal className="pb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-balance">
                {tr('usagePage.title')}
              </h1>
              <p className="mt-1 text-muted-foreground">{tr('usagePage.subtitle')}</p>
            </Reveal>

            <Reveal delayIndex={1} className="glass block rounded-2xl p-5 shadow-(--elevate-1)">
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
                        {tr('usagePage.usedOf', {
                          used: formatBytes(usage.used),
                          limit: formatBytes(usage.limit),
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {overLimit
                          ? tr('usagePage.limitReached')
                          : tr('usagePage.free', {
                              amount: formatBytes(Math.max(0, usage.limit - usage.used)),
                            })}
                      </p>
                    </div>
                  </div>
                  <UsageBar used={usage.used} limit={usage.limit} className="mt-4" />
                </>
              )}
            </Reveal>

            <Reveal delayIndex={2} className="mt-8 mb-3 flex gap-1 rounded-xl bg-muted/60 p-1 text-sm">
              {(['tracks', 'projects'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={
                    'relative flex-1 rounded-lg px-3 py-1.5 font-medium transition-colors ' +
                    (tab === t
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground')
                  }
                >
                  {tab === t && (
                    <motion.span
                      layoutId="usage-tab"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className="absolute inset-0 -z-10 rounded-lg bg-background shadow-sm"
                    />
                  )}
                  {t === 'tracks'
                    ? usage
                      ? tr('usagePage.tabTracksCount', { count: usage.tracks.length })
                      : tr('usagePage.tabTracks')
                    : usage
                      ? tr('usagePage.tabProjectsCount', { count: usage.projects.length })
                      : tr('usagePage.tabProjects')}
                </button>
              ))}
            </Reveal>

            <Reveal delayIndex={3}>
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
            ) : tab === 'tracks' ? (
              usage.tracks.length === 0 ? (
                <EmptyState text={tr('usagePage.emptyTracks')} />
              ) : (
                <List>
                  {usage.tracks.map((track) => (
                    <Row
                      key={track._id}
                      title={track.title}
                      badge={track.kind === 'project' ? tr('usagePage.project') : undefined}
                      subtitle={
                        (track.playlistName ?? tr('usagePage.noPlaylist')) +
                        (track.versionCount > 1
                          ? ` · ${tr('usagePage.versionsCount', { count: track.versionCount })}`
                          : '')
                      }
                      size={track.size}
                      deleting={deletingId === track._id}
                      onDelete={() => handleDeleteClick({ kind: 'track', item: track })}
                    />
                  ))}
                </List>
              )
            ) : usage.projects.length === 0 ? (
              <EmptyState text={tr('usagePage.emptyProjects')} />
            ) : (
              <List>
                {usage.projects.map((project) => (
                  <Row
                    key={project.versionId}
                    title={project.filename}
                    subtitle={`${project.trackTitle} · ${project.versionLabel}`}
                    size={project.size}
                    deleting={deletingId === project.versionId}
                    onDelete={() => handleDeleteClick({ kind: 'project', item: project })}
                  />
                ))}
              </List>
            )}
            </Reveal>
          </main>
        </div>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.kind === 'project'
                ? tr('usagePage.deleteProjectTitle')
                : tr('usagePage.deleteTrackTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.kind === 'track'
                ? tr('usagePage.deleteTrackBody', { title: deleteTarget.item.title })
                : deleteTarget?.kind === 'project'
                  ? tr('usagePage.deleteProjectBody', {
                      name: deleteTarget.item.filename,
                      size: formatBytes(deleteTarget.item.size),
                    })
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
            {tr('usagePage.dontAskAgain')}
          </label>

          <AlertDialogFooter>
            <AlertDialogCancel>{tr('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
            >
              {tr('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RequireAuth>
  )
}

function List({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border">
      {children}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}

function Row({
  title,
  subtitle,
  badge,
  size,
  deleting,
  onDelete,
}: {
  title: string
  subtitle: string
  badge?: string
  size: number
  deleting: boolean
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-3 bg-card/40 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
          <span className="truncate">{title}</span>
          {badge && (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {badge}
            </span>
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <span className="shrink-0 font-mono text-sm tabular-nums">{formatBytes(size)}</span>
      <button
        onClick={onDelete}
        disabled={deleting}
        aria-label={title}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
      >
        {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </button>
    </div>
  )
}
