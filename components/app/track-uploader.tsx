'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { audioApi, uploadToPresignedUrl, ApiError } from '@/lib/api'
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
  }
>(function TrackUploader({ playlistId, onUploaded }, ref) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<UploadItem[]>([])

  async function handleFiles(fileList: FileList | File[] | null) {
    if (!fileList) return
    const files = Array.from(fileList)
    if (files.length === 0) return

    for (const file of files) {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Dateityp nicht unterstützt`)
        continue
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name}: Datei zu groß (max. 500 MB)`)
        continue
      }

      setItems((prev) => [
        ...prev,
        { id, filename: file.name, size: file.size, progress: 0, status: 'uploading' },
      ])

      uploadOne(file, id).catch(() => {
        // errors are handled inside uploadOne
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

      // Remove finished item from the list after a short delay
      setTimeout(() => {
        setItems((prev) => prev.filter((it) => it.id !== id))
      }, 1500)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Upload fehlgeschlagen'
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: 'error', error: message } : it)),
      )
      toast.error(`${file.name}: ${message}`)
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
        accept="audio/*"
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <Button size="lg" onClick={() => inputRef.current?.click()}>
        <Upload className="size-4" />
        Tracks hochladen
      </Button>

      {items.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card/60 p-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{item.filename}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.status === 'error'
                      ? 'Fehler'
                      : item.status === 'confirming'
                        ? 'Wird verarbeitet…'
                        : item.status === 'done'
                          ? 'Fertig'
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
                  aria-label="Entfernen"
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
