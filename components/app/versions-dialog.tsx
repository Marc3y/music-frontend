'use client'

import { useRef, useState } from 'react'
import { Download, Loader2, Music, Paperclip, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { audioApi, uploadToPresignedUrl, ApiError } from '@/lib/api'
import { analyzeAudioFile } from '@/lib/audio-analysis'
import { formatBytes } from '@/lib/format'
import type { AudioFile, TrackVersion } from '@/lib/types'

function errMsg(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback
}

export function VersionsDialog({
  track,
  open,
  onOpenChange,
  onUpdated,
}: {
  track: AudioFile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (track: AudioFile) => void
}) {
  const audioInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)

  const trackId = track?._id

  async function handleNewVersion(file: File | undefined) {
    if (!file || !trackId) return
    setBusy(true)
    setProgress(0)
    try {
      const { uploadUrl, key } = await audioApi.initVersionUpload(trackId, {
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        fileSize: file.size,
      })
      await uploadToPresignedUrl(uploadUrl, file, file.type || 'application/octet-stream', setProgress)
      let updated = await audioApi.confirmVersionUpload(trackId, {
        key,
        originalFilename: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
      })
      onUpdated(updated)
      toast.success('Version hochgeladen')

      const { bpm, musicalKey } = await analyzeAudioFile(file)
      if (bpm != null || musicalKey != null) {
        updated = await audioApi.updateVersion(trackId, updated.selectedVersionId, {
          bpm,
          musicalKey,
        })
        onUpdated(updated)
      }
    } catch (err) {
      toast.error(errMsg(err, 'Upload fehlgeschlagen'))
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  async function selectVersion(versionId: string) {
    if (!trackId) return
    try {
      onUpdated(await audioApi.selectVersion(trackId, versionId))
      toast.success('Hauptversion geändert')
    } catch (err) {
      toast.error(errMsg(err, 'Umschalten fehlgeschlagen'))
    }
  }

  async function deleteVersion(versionId: string) {
    if (!trackId) return
    try {
      onUpdated(await audioApi.deleteVersion(trackId, versionId))
      toast.success('Version gelöscht')
    } catch (err) {
      toast.error(errMsg(err, 'Löschen fehlgeschlagen'))
    }
  }

  const versions = track ? [...track.versions].reverse() : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Versionen{track ? ` – ${track.title}` : ''}</DialogTitle>
          <DialogDescription>
            Lade weitere Versionen hoch und wähle, welche abgespielt und geteilt wird.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          hidden
          onChange={(e) => {
            handleNewVersion(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        <div>
          <Button
            variant="outline"
            disabled={busy || !track}
            onClick={() => audioInputRef.current?.click()}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Neue Version hochladen
          </Button>
          {progress !== null && (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto">
          {versions.map((v) => (
            <VersionRow
              key={`${v._id}-${v.bpm ?? ''}-${v.musicalKey ?? ''}-${v.projectFilename ?? ''}-${v.status}`}
              trackId={trackId!}
              version={v}
              isSelected={v._id === track?.selectedVersionId}
              canDelete={(track?.versions.length ?? 0) > 1}
              onSelect={() => selectVersion(v._id)}
              onDelete={() => deleteVersion(v._id)}
              onUpdated={onUpdated}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function VersionRow({
  trackId,
  version,
  isSelected,
  canDelete,
  onSelect,
  onDelete,
  onUpdated,
}: {
  trackId: string
  version: TrackVersion
  isSelected: boolean
  canDelete: boolean
  onSelect: () => void
  onDelete: () => void
  onUpdated: (track: AudioFile) => void
}) {
  const projectInputRef = useRef<HTMLInputElement>(null)
  const [bpm, setBpm] = useState(version.bpm != null ? String(version.bpm) : '')
  const [musicalKey, setMusicalKey] = useState(version.musicalKey ?? '')
  const [savingMeta, setSavingMeta] = useState(false)
  const [projectBusy, setProjectBusy] = useState(false)

  async function saveMeta() {
    const nextBpm = bpm.trim() === '' ? null : Math.round(Number(bpm))
    const nextKey = musicalKey.trim() === '' ? null : musicalKey.trim()
    if ((version.bpm ?? null) === (nextBpm ?? null) && (version.musicalKey ?? null) === nextKey) {
      return
    }
    if (nextBpm != null && (!Number.isFinite(nextBpm) || nextBpm < 1 || nextBpm > 400)) {
      toast.error('BPM muss zwischen 1 und 400 liegen')
      return
    }
    setSavingMeta(true)
    try {
      onUpdated(await audioApi.updateVersion(trackId, version._id, { bpm: nextBpm, musicalKey: nextKey }))
    } catch (err) {
      toast.error(errMsg(err, 'Speichern fehlgeschlagen'))
    } finally {
      setSavingMeta(false)
    }
  }

  async function uploadProject(file: File | undefined) {
    if (!file) return
    const name = file.name.toLowerCase()
    if (!name.endsWith('.zip') && !name.endsWith('.rar')) {
      toast.error('Nur .zip- oder .rar-Dateien')
      return
    }
    setProjectBusy(true)
    try {
      const ct = file.type || 'application/octet-stream'
      const { uploadUrl, key } = await audioApi.initVersionProject(trackId, version._id, {
        filename: file.name,
        contentType: ct,
        fileSize: file.size,
      })
      await uploadToPresignedUrl(uploadUrl, file, ct)
      onUpdated(
        await audioApi.confirmVersionProject(trackId, version._id, {
          key,
          filename: file.name,
          fileSize: file.size,
        }),
      )
      toast.success('Projektdatei hochgeladen')
    } catch (err) {
      toast.error(errMsg(err, 'Upload fehlgeschlagen'))
    } finally {
      setProjectBusy(false)
    }
  }

  async function downloadProject() {
    try {
      const { url } = await audioApi.versionProjectDownload(trackId, version._id)
      window.location.assign(url)
    } catch (err) {
      toast.error(errMsg(err, 'Download fehlgeschlagen'))
    }
  }

  async function removeProject() {
    setProjectBusy(true)
    try {
      onUpdated(await audioApi.deleteVersionProject(trackId, version._id))
      toast.success('Projektdatei entfernt')
    } catch (err) {
      toast.error(errMsg(err, 'Entfernen fehlgeschlagen'))
    } finally {
      setProjectBusy(false)
    }
  }

  return (
    <div
      className={
        'flex flex-col gap-3 rounded-xl border p-3 ' +
        (isSelected ? 'border-primary/50 bg-primary/5' : 'border-border')
      }
    >
      <div className="flex items-start gap-3">
        <label className="mt-0.5 flex cursor-pointer items-center">
          <input
            type="radio"
            name={`main-version-${trackId}`}
            checked={isSelected}
            onChange={onSelect}
            className="size-4 accent-primary"
          />
        </label>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{version.label}</p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(version.fileSize)}
            {isSelected && ' · Hauptversion'}
            {version.status === 'processing' && ' · wird verarbeitet…'}
            {version.status === 'failed' && ' · fehlgeschlagen'}
          </p>
        </div>
        <button
          onClick={onDelete}
          disabled={!canDelete}
          aria-label="Version löschen"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 pl-7">
        <Input
          value={bpm}
          onChange={(e) => setBpm(e.target.value.replace(/[^\d]/g, ''))}
          onBlur={saveMeta}
          inputMode="numeric"
          placeholder="BPM"
          className="h-7 w-20 text-xs"
        />
        <Input
          value={musicalKey}
          onChange={(e) => setMusicalKey(e.target.value)}
          onBlur={saveMeta}
          placeholder="Key (z. B. A moll)"
          maxLength={20}
          className="h-7 flex-1 text-xs"
        />
        {savingMeta && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      </div>

      <div className="flex items-center gap-2 pl-7 text-xs">
        <input
          ref={projectInputRef}
          type="file"
          accept=".zip,.rar"
          hidden
          onChange={(e) => {
            uploadProject(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        {version.projectFilename ? (
          <>
            <Music className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{version.projectFilename}</span>
            <span className="shrink-0 text-muted-foreground">
              {formatBytes(version.projectSize ?? 0)}
            </span>
            <button
              onClick={downloadProject}
              aria-label="Projektdatei herunterladen"
              className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <Download className="size-3.5" />
            </button>
            <button
              onClick={removeProject}
              disabled={projectBusy}
              aria-label="Projektdatei entfernen"
              className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-40"
            >
              {projectBusy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
            </button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled={projectBusy}
            onClick={() => projectInputRef.current?.click()}
            className="text-muted-foreground"
          >
            {projectBusy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Paperclip className="size-3.5" />
            )}
            Projektdatei hinzufügen (.zip/.rar)
          </Button>
        )}
      </div>
    </div>
  )
}
