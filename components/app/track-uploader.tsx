'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { audioApi, uploadToPresignedUrl, ApiError } from '@/lib/api'
import { useT } from '@/lib/i18n/context'
import { analyzeAudioFile } from '@/lib/audio-analysis'
import { formatBytes } from '@/lib/format'
import type { AudioFile } from '@/lib/types'

const ALLOWED_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/x-flac',
  'audio/mp4',
  'audio/aac',
  'audio/ogg',
]
const MAX_SIZE = 500 * 1024 * 1024

function isProjectFile(file: File) {
  const n = file.name.toLowerCase()
  return n.endsWith('.zip') || n.endsWith('.rar')
}

interface UploadItem {
  id: string
  filename: string
  size: number
  progress: number
  status: 'uploading' | 'confirming' | 'done' | 'error'
  error?: string
}

export interface TrackUploaderHandle {
  handleFiles: (files: FileList | File[] | null) => void
}

export const TrackUploader = forwardRef<
  TrackUploaderHandle,
  {
    playlistId: string
    onUploaded: (track: AudioFile) => void
    onPatched?: (track: AudioFile) => void
  }
>(function TrackUploader({ playlistId, onUploaded, onPatched }, ref) {
  const t = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<UploadItem[]>([])

  async function handleFiles(fileList: FileList | File[] | null) {
    if (!fileList) return
    const files = Array.from(fileList)
    if (files.length === 0) return

    for (const file of files) {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const project = isProjectFile(file)

      if (!project && !ALLOWED_TYPES.includes(file.type)) {
        toast.error(t('uploader.unsupportedType', { name: file.name }))
        continue
      }
      if (!project && file.size > MAX_SIZE) {
        toast.error(t('uploader.tooLarge', { name: file.name }))
        continue
      }

      setItems((prev) => [
        ...prev,
        { id, filename: file.name, size: file.size, progress: 0, status: 'uploading' },
      ])

      const run = project ? uploadProjectOne(file, id) : uploadOne(file, id)
      run.catch(() => {
        // errors are handled inside the upload fns
      })
    }
  }

  useImperativeHandle(ref, () => ({ handleFiles }))

  async function uploadOne(file: File, id: string) {
    try {
      const { uploadUrl, key } = await audioApi.initUpload(playlistId, {
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
      })

      await uploadToPresignedUrl(uploadUrl, file, file.type, (percent) => {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, progress: percent } : it)),
        )
      })

      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: 'confirming' } : it)),
      )

      const track = await audioApi.confirmUpload(playlistId, {
        key,
        originalFilename: file.name,
        fileSize: file.size,
        mimeType: file.type,
      })

      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'done' } : it)))
      onUploaded(track)

      // BPM/Key im Browser ermitteln und nachtragen (blockt den Upload nicht)
      void analyzeAudioFile(file)
        .then(({ bpm, musicalKey }) => {
          if (bpm == null && musicalKey == null) return
          return audioApi
            .updateVersion(track._id, track.selectedVersionId, { bpm, musicalKey })
            .then((updated) => onPatched?.(updated))
        })
        .catch(() => {
          /* Analyse ist best effort */
        })

      // Remove finished item from the list after a short delay
      setTimeout(() => {
        setItems((prev) => prev.filter((it) => it.id !== id))
      }, 1500)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('uploader.uploadFailed')
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: 'error', error: message } : it)),
      )
      toast.error(t('toast.fileError', { name: file.name, message }))
    }
  }

  async function uploadProjectOne(file: File, id: string) {
    try {
      const ct = file.type || 'application/octet-stream'
      const { uploadUrl, key } = await audioApi.initProjectUpload(playlistId, {
        filename: file.name,
        contentType: ct,
        fileSize: file.size,
      })

      await uploadToPresignedUrl(uploadUrl, file, ct, (percent) => {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, progress: percent } : it)),
        )
      })

      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: 'confirming' } : it)),
      )

      const track = await audioApi.confirmProjectUpload(playlistId, {
        key,
        filename: file.name,
        fileSize: file.size,
      })

      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'done' } : it)))
      onUploaded(track)

      setTimeout(() => {
        setItems((prev) => prev.filter((it) => it.id !== id))
      }, 1500)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('uploader.uploadFailed')
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: 'error', error: message } : it)),
      )
      toast.error(t('toast.fileError', { name: file.name, message }))
    }
  }

  function dismiss(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.zip,.rar"
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <Button size="lg" onClick={() => inputRef.current?.click()}>
        <Upload className="size-4" />
        {t('uploader.button')}
      </Button>

      {items.length > 0 && (
        <div className="glass flex flex-col gap-2 rounded-2xl p-3 shadow-(--elevate-1)">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{item.filename}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.status === 'error'
                      ? t('uploader.statusError')
                      : item.status === 'confirming'
                        ? t('uploader.statusProcessing')
                        : item.status === 'done'
                          ? t('uploader.statusDone')
                          : `${item.progress}%`}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={
                      item.status === 'error'
                        ? 'h-full bg-destructive'
                        : 'h-full bg-primary transition-all duration-300'
                    }
                    style={{
                      width:
                        item.status === 'done' || item.status === 'confirming'
                          ? '100%'
                          : `${item.progress}%`,
                    }}
                  />
                </div>
                {item.error && (
                  <p className="mt-1 text-xs text-destructive">{item.error}</p>
                )}
                {item.status === 'uploading' && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatBytes(item.size)}
                  </p>
                )}
              </div>
              {item.status === 'confirming' ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <button
                  onClick={() => dismiss(item.id)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label={t('common.remove')}
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
