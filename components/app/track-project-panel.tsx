'use client'

import { useState } from 'react'
import { Check, Copy, Download, FileArchive, Loader2, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { audioApi, ApiError } from '@/lib/api'
import { formatBytes } from '@/lib/format'
import type { AudioFile } from '@/lib/types'

function errMsg(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback
}

export function TrackProjectPanel({
  track,
  onUpdated,
}: {
  track: AudioFile
  onUpdated: (track: AudioFile) => void
}) {
  const version = track.versions?.find((v) => v._id === track.selectedVersionId)
  const [busy, setBusy] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!version?.projectFilename) {
    return (
      <div className="ml-7 mt-1 rounded-xl border border-border bg-card/40 px-3 py-2.5 text-xs text-muted-foreground">
        Diese Version hat keine Projektdatei – im Versionen-Dialog hinzufügen.
      </div>
    )
  }

  const shareUrl =
    typeof window !== 'undefined' && track.projectShareToken
      ? `${window.location.origin}/share/project/${track.projectShareToken}`
      : ''

  async function download() {
    try {
      const { url } = await audioApi.versionProjectDownload(track._id, version!._id)
      window.location.assign(url)
    } catch (err) {
      toast.error(errMsg(err, 'Download fehlgeschlagen'))
    }
  }

  async function enableShare() {
    setBusy(true)
    try {
      const res = await audioApi.enableProjectShare(track._id)
      onUpdated({ ...track, projectShareEnabled: true, projectShareToken: res.token })
      setShareOpen(true)
    } catch (err) {
      toast.error(errMsg(err, 'Teilen fehlgeschlagen'))
    } finally {
      setBusy(false)
    }
  }

  async function disableShare() {
    setBusy(true)
    try {
      await audioApi.disableProjectShare(track._id)
      onUpdated({ ...track, projectShareEnabled: false })
      toast.success('Projekt-Teilen beendet')
    } catch (err) {
      toast.error(errMsg(err, 'Deaktivieren fehlgeschlagen'))
    } finally {
      setBusy(false)
    }
  }

  async function copyLink() {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Link kopiert')
    setTimeout(() => setCopied(false), 2000)
  }

  const isShared = Boolean(track.projectShareEnabled)

  return (
    <div className="ml-7 mt-1 flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-3">
      <div className="flex items-center gap-3">
        <FileArchive className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{version.projectFilename}</p>
          <p className="text-xs text-muted-foreground">
            Projektdatei · {formatBytes(version.projectSize ?? 0)}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={download}>
          <Download className="size-3.5" />
          Download
        </Button>
        <Button
          variant={isShared ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => (isShared ? setShareOpen((o) => !o) : enableShare())}
          disabled={busy}
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Share2 className="size-3.5" />}
          Teilen
        </Button>
      </div>

      {isShared && shareOpen && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            Wer diesen Link hat, kann nur die Projektdatei herunterladen:
          </p>
          <div className="flex gap-2">
            <Input readOnly value={shareUrl} className="h-8 text-xs" />
            <Button variant="outline" size="icon-sm" onClick={copyLink}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="self-start text-muted-foreground"
            onClick={disableShare}
            disabled={busy}
          >
            Teilen beenden
          </Button>
        </div>
      )}
    </div>
  )
}
