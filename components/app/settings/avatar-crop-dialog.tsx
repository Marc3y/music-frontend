'use client'

import { useCallback, useEffect, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Loader2 } from 'lucide-react'
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
import { Slider } from '@/components/ui/slider'
import { accountApi, uploadToPresignedUrl, ApiError } from '@/lib/api'

const OUTPUT_SIZE = 512

/** Draws the selected crop area of `src` into a square canvas and returns a JPEG blob. */
async function getCroppedBlob(src: string, area: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
    img.src = src
  })

  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas nicht verfügbar')

  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Bild konnte nicht erzeugt werden'))),
      'image/jpeg',
      0.9,
    )
  })
}

export function AvatarCropDialog({
  file,
  open,
  onOpenChange,
  onUploaded,
}: {
  file: File | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploaded: () => Promise<void> | void
}) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [areaPixels, setAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!file) {
      setImageSrc(null)
      return
    }
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setAreaPixels(pixels)
  }, [])

  async function handleSave() {
    if (!imageSrc || !areaPixels || !file) return
    setSaving(true)
    try {
      const blob = await getCroppedBlob(imageSrc, areaPixels)
      const { uploadUrl } = await accountApi.avatarUploadUrl({
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
      })
      await uploadToPresignedUrl(uploadUrl, blob, 'image/jpeg')
      await onUploaded()
      toast.success('Profilbild aktualisiert')
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Profilbild konnte nicht gespeichert werden',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profilbild zuschneiden</DialogTitle>
          <DialogDescription>
            Verschiebe den Bildausschnitt und zoome, bis er passt.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-64 w-full overflow-hidden rounded-xl bg-muted">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.01}
            onValueChange={(v) => setZoom(Array.isArray(v) ? v[0] : v)}
            className="flex-1"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving || !areaPixels}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Übernehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
