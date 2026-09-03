'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ImagePlus, Loader2, Music } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageCropDialog } from '@/components/app/image-crop-dialog'
import { playlistApi, uploadToPresignedUrl, ApiError } from '@/lib/api'
import type { Playlist } from '@/lib/types'

export function EditPlaylistDialog({
  playlist,
  open,
  onOpenChange,
  onUpdated,
}: {
  playlist: Playlist | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (playlist: Playlist) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [pendingCrop, setPendingCrop] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (playlist) {
      setName(playlist.name)
      setCoverPreview(playlist.coverUrl ?? null)
      setCoverFile(null)
      setError(null)
    }
  }, [playlist])

  function handleCoverSelect(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte eine Bilddatei auswählen')
      return
    }
    setPendingCrop(file)
  }

  function handleCropped(blob: Blob) {
    const cropped = new File([blob], 'cover.jpg', { type: 'image/jpeg' })
    setCoverFile(cropped)
    setCoverPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(cropped)
    })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!playlist || !name.trim()) return
    setError(null)
    setLoading(true)
    try {
      if (coverFile) {
        const { uploadUrl } = await playlistApi.coverUploadUrl(playlist._id, {
          filename: coverFile.name,
          contentType: coverFile.type,
        })
        await uploadToPresignedUrl(uploadUrl, coverFile, coverFile.type)
      }

      const updated = await playlistApi.update(playlist._id, name.trim())
      toast.success('Playlist aktualisiert')
      onUpdated({ ...updated, coverUrl: coverFile ? coverPreview : updated.coverUrl })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Aktualisieren fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Playlist bearbeiten</DialogTitle>
          <DialogDescription>Name und Cover anpassen.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative size-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/25 to-accent/15"
            >
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <Music className="size-6 text-foreground/40" />
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
                <ImagePlus className="size-5" />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                handleCoverSelect(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <p className="text-xs text-muted-foreground">
              Klicke auf das Bild, um ein Cover hochzuladen (optional).
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-playlist-name">Name</Label>
            <Input
              id="edit-playlist-name"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <ImageCropDialog
      file={pendingCrop}
      open={pendingCrop !== null}
      onOpenChange={(o) => !o && setPendingCrop(null)}
      title="Cover zuschneiden"
      onCropped={handleCropped}
    />
    </>
  )
}
