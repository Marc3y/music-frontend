'use client'

import { Download, FileArchive, Loader2, Pause, Play, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { audioApi, accountApi, ApiError } from '@/lib/api'
import { usePlayer } from '@/lib/player-context'
import { formatBytes } from '@/lib/format'
import type { SavedShare } from '@/lib/types'

function errMsg(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback
}

export function SharedItemsList({
  items,
  onRemoved,
}: {
  items: SavedShare[]
  onRemoved: (id: string) => void
}) {
  const player = usePlayer()
  const [busyId, setBusyId] = useState<string | null>(null)

  const audioItems = items.filter((i) => i.type === 'audio')

  function playAudio(item: SavedShare) {
    const id = `saved-${item.token}`
    if (player.current?.id === id) {
      player.togglePlay()
      return
    }
    const startIndex = audioItems.findIndex((i) => i._id === item._id)
    player.playQueue(
      audioItems.map((i) => ({
        id: `saved-${i.token}`,
        title: i.title,
        artist: i.artist,
        getStreamUrl: async () => (await audioApi.publicStream(i.token)).streamUrl,
      })),
      Math.max(0, startIndex),
    )
  }

  async function downloadAudioProject(item: SavedShare) {
    setBusyId(item._id)
    try {
      const res = await audioApi.publicStream(item.token)
      if (res.projectUrl) window.location.assign(res.projectUrl)
      else toast.error('Projektdatei nicht mehr verfügbar')
    } catch (err) {
      toast.error(errMsg(err, 'Download fehlgeschlagen'))
    } finally {
      setBusyId(null)
    }
  }

  async function downloadProject(item: SavedShare) {
    setBusyId(item._id)
    try {
      const res = await audioApi.publicProjectShare(item.token)
      window.location.assign(res.url)
    } catch (err) {
      toast.error(errMsg(err, 'Download fehlgeschlagen'))
    } finally {
      setBusyId(null)
    }
  }

  async function remove(item: SavedShare) {
    try {
      await accountApi.removeSavedShare(item._id)
      onRemoved(item._id)
    } catch (err) {
      toast.error(errMsg(err, 'Entfernen fehlgeschlagen'))
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        Noch nichts hinzugefügt. Öffne einen geteilten Link und tippe auf „Zur Mediathek
        hinzufügen".
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border">
      {items.map((item) => {
        const isAudio = item.type === 'audio'
        const playing = player.current?.id === `saved-${item.token}` && player.isPlaying
        return (
          <div key={item._id} className="flex items-center gap-3 bg-card/40 px-4 py-3">
            {isAudio ? (
              <button
                onClick={() => playAudio(item)}
                aria-label={playing ? 'Pause' : 'Abspielen'}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/25 to-accent/15"
              >
                {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
              </button>
            ) : (
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/25 to-accent/15">
                <FileArchive className="size-4 text-foreground/50" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {isAudio
                  ? [
                      item.artist || 'Unbekannter Interpret',
                      item.bpm ? `${item.bpm} BPM` : null,
                      item.musicalKey || null,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : `Projekt${item.projectSize ? ` · ${formatBytes(item.projectSize)}` : ''}`}
              </p>
            </div>

            {isAudio && item.projectFilename && (
              <button
                onClick={() => downloadAudioProject(item)}
                disabled={busyId === item._id}
                aria-label="Projektdatei herunterladen"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                {busyId === item._id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
              </button>
            )}

            {!isAudio && (
              <button
                onClick={() => downloadProject(item)}
                disabled={busyId === item._id}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
              >
                {busyId === item._id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                Download
              </button>
            )}

            <button
              onClick={() => remove(item)}
              aria-label="Aus Mediathek entfernen"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
