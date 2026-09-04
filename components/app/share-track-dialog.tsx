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
import { Switch } from '@/components/ui/switch'
import { audioApi, ApiError } from '@/lib/api'
import { useT } from '@/lib/i18n/context'
import type { AudioFile } from '@/lib/types'

function errMsg(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback
}

export function ShareTrackDialog({
  track,
  open,
  forceProject,
  onOpenChange,
  onUpdated,
}: {
  track: AudioFile | null
  open: boolean
  forceProject?: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (track: AudioFile) => void
}) {
  const t = useT()
  const isProject = track?.kind === 'project' || !!forceProject
  const [loading, setLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [shareProject, setShareProject] = useState(false)

  const selectedVersion = track?.versions?.find((v) => v._id === track.selectedVersionId)
  const hasProject = Boolean(selectedVersion?.projectFilename)

  useEffect(() => {
    if (isProject) {
      setShareUrl(
        track?.projectShareEnabled && track.projectShareToken
          ? `${window.location.origin}/share/project/${track.projectShareToken}`
          : null,
      )
    } else if (track?.shareEnabled && track.shareToken) {
      setShareUrl(`${window.location.origin}/share/${track.shareToken}`)
    } else {
      setShareUrl(null)
    }
    setShareProject(Boolean(track?.shareProject))
    setCopied(false)
  }, [track, isProject])

  async function enableShare() {
    if (!track) return
    setLoading(true)
    try {
      if (isProject) {
        const res = await audioApi.enableProjectShare(track._id)
        setShareUrl(res.shareUrl)
        onUpdated({ ...track, projectShareEnabled: true, projectShareToken: res.token })
      } else {
        const res = await audioApi.share(track._id, hasProject ? shareProject : false)
        setShareUrl(res.shareUrl)
        onUpdated({
          ...track,
          shareEnabled: true,
          shareToken: res.shareToken,
          shareProject: res.shareProject,
        })
      }
      toast.success(t('toast.sharingEnabled'))
    } catch (err) {
      toast.error(errMsg(err, t('shareTrack.enableFailed')))
    } finally {
      setLoading(false)
    }
  }

  async function disableShare() {
    if (!track) return
    setLoading(true)
    try {
      if (isProject) {
        await audioApi.disableProjectShare(track._id)
        onUpdated({ ...track, projectShareEnabled: false })
      } else {
        await audioApi.unshare(track._id)
        onUpdated({ ...track, shareEnabled: false })
      }
      setShareUrl(null)
      toast.success(t('toast.sharingDisabled'))
    } catch (err) {
      toast.error(errMsg(err, t('shareTrack.disableFailed')))
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
      toast.error(errMsg(err, t('shareTrack.changeFailed')))
    }
  }

  async function copyLink() {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success(t('toast.linkCopied'))
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isProject ? t('shareTrack.titleProject') : t('shareTrack.titleTrack')}
          </DialogTitle>
          <DialogDescription>
            {isProject
              ? t('shareTrack.descProject', { title: track?.title ?? '' })
              : t('shareTrack.descTrack', { title: track?.title ?? '' })}
          </DialogDescription>
        </DialogHeader>

        {!isProject && (
          <label
            className={
              'flex items-start justify-between gap-3 text-sm ' +
              (hasProject ? 'text-foreground' : 'text-muted-foreground')
            }
          >
            <span>
              {t('shareTrack.includeProject')}
              {!hasProject && t('shareTrack.noProjectHint')}
            </span>
            <Switch
              className="mt-0.5"
              checked={hasProject && shareProject}
              disabled={!hasProject}
              onCheckedChange={(v) => toggleShareProject(v)}
            />
          </label>
        )}

        {shareUrl ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input readOnly value={shareUrl} className="text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={copyLink}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <Button type="button" variant="outline" disabled={loading} onClick={disableShare}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {t('shareTrack.disable')}
            </Button>
          </div>
        ) : (
          <Button type="button" disabled={loading} onClick={enableShare}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Share2 className="size-4" />
            )}
            {t('shareTrack.enable')}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
