'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Loader2, Share2 } from 'lucide-react'
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
import { audioApi, ApiError } from '@/lib/api'
import type { AudioFile } from '@/lib/types'

export function ShareTrackDialog({
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
  const [loading, setLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [shareProject, setShareProject] = useState(false)

  const selectedVersion = track?.versions?.find(
    (v) => v._id === track.selectedVersionId,
  )
  const hasProject = Boolean(selectedVersion?.projectFilename)

  useEffect(() => {
    if (track?.shareEnabled && track.shareToken) {
      setShareUrl(`${window.location.origin}/share/${track.shareToken}`)
    } else {
      setShareUrl(null)
    }
    setShareProject(Boolean(track?.shareProject))
    setCopied(false)
  }, [track])

  async function enableShare() {
    if (!track) return
    setLoading(true)
    try {
      const res = await audioApi.share(track._id, hasProject ? shareProject : false)
      setShareUrl(res.shareUrl)
      onUpdated({
        ...track,
        shareEnabled: true,
        shareToken: res.shareToken,
        shareProject: res.shareProject,
      })
      toast.success('Teilen aktiviert')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Aktivieren fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  async function toggleShareProject(next: boolean) {
    setShareProject(next)
    if (!track || !shareUrl) return
    try {
      const res = await audioApi.share(track._id, next)
      onUpdated({ ...track, shareProject: res.shareProject })
    } catch (err) {
      setShareProject(!next)
      toast.error(err instanceof ApiError ? err.message : 'Änderung fehlgeschlagen')
    }
  }

  async function disableShare() {
    if (!track) return
    setLoading(true)
    try {
      await audioApi.unshare(track._id)
      setShareUrl(null)
      onUpdated({ ...track, shareEnabled: false })
      toast.success('Teilen deaktiviert')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Deaktivieren fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  async function copyLink() {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Link kopiert')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Track teilen</DialogTitle>
          <DialogDescription>
            Wer den Link hat, kann "{track?.title}" (Hauptversion) ohne Login anhören.
          </DialogDescription>
        </DialogHeader>

        <label
          className={
            'flex items-start gap-2 text-sm ' +
            (hasProject ? 'text-foreground' : 'text-muted-foreground')
          }
        >
          <input
            type="checkbox"
            checked={hasProject && shareProject}
            disabled={!hasProject}
            onChange={(e) => toggleShareProject(e.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            Projektdatei der Hauptversion mitteilen
            {!hasProject && ' (Hauptversion hat keine Projektdatei)'}
          </span>
        </label>

        {shareUrl ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input readOnly value={shareUrl} className="text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={copyLink}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={disableShare}
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Teilen deaktivieren
            </Button>
          </div>
        ) : (
          <Button type="button" disabled={loading} onClick={enableShare}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Share2 className="size-4" />
            )}
            Teilen aktivieren
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
