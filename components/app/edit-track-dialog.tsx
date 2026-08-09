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
import { Textarea } from '@/components/ui/textarea'
import { audioApi, uploadToPresignedUrl, ApiError } from '@/lib/api'
import type { AudioFile } from '@/lib/types'

export function EditTrackDialog({
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [description, setDescription] = useState('')
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (track) {
      setTitle(track.title)
      setArtist(track.artist ?? '')
      setDescription(track.description ?? '')
      setCoverPreview(track.coverUrl ?? null)
      setCoverFile(null)
      setError(null)
    }
  }, [track])

  function handleCoverSelect(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte eine Bilddatei auswählen')
      return
    }
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!track) return
    setError(null)
    setLoading(true)
    try {
      if (coverFile) {
        const { uploadUrl } = await audioApi.coverUploadUrl(track._id, {
          filename: coverFile.name,
          contentType: coverFile.type,
        })
        await uploadToPresignedUrl(uploadUrl, coverFile, coverFile.type)
      }

      const updated = await audioApi.update(track._id, {
        title: title.trim(),
        artist: artist.trim() || undefined,
        description: description.trim() || undefined,
      })

      toast.success('Track aktualisiert')
      onUpdated({ ...updated, coverUrl: coverFile ? coverPreview : updated.coverUrl })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Aktualisieren fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Track bearbeiten</DialogTitle>
          <DialogDescription>
            Titel, Interpret, Beschreibung und Cover anpassen.
          </DialogDescription>
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
              onChange={(e) => handleCoverSelect(e.target.files?.[0])}
            />
            <p className="text-xs text-muted-foreground">
              Klicke auf das Bild, um ein eigenes Cover hochzuladen (optional).
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="track-title">Titel</Label>
            <Input
              id="track-title"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="track-artist">Interpret</Label>
            <Input
              id="track-artist"
              maxLength={200}
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="track-description">Beschreibung</Label>
            <Textarea
              id="track-description"
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
