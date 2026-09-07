'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BarsWaveform } from '@/components/player/bars-waveform'
import { audioApi, ApiError } from '@/lib/api'
import { getCachedPeaks } from '@/lib/audio-cache'
import { useI18n } from '@/lib/i18n/context'
import {
  formatBytes,
  formatDateTime,
  formatMusicalKey,
  formatTime,
} from '@/lib/format'
import type { TrackInfo } from '@/lib/types'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 py-2 text-sm last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium break-words">{value}</span>
    </div>
  )
}

export function TrackInfoDialog({
  trackId,
  open,
  onOpenChange,
}: {
  trackId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t, locale } = useI18n()
  const [info, setInfo] = useState<TrackInfo | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!open) return
    setInfo(null)
    setError(false)
    audioApi
      .info(trackId)
      .then(setInfo)
      .catch((e) => setError(e instanceof ApiError))
  }, [open, trackId])

  const v = info?.selectedVersion
  const cachedPeaks = getCachedPeaks(trackId).peaks?.[0]
  const peaks = cachedPeaks ? Array.from(cachedPeaks as ArrayLike<number>) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{info?.title ?? t('trackInfo.title')}</DialogTitle>
          <DialogDescription>{t('trackInfo.subtitle')}</DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('trackInfo.failed')}
          </p>
        ) : !info ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl bg-muted/40 p-3">
              {peaks.length > 1 ? (
                <BarsWaveform peaks={peaks} progress={0} barCount={64} className="h-12" />
              ) : (
                <p className="py-3 text-center text-xs text-muted-foreground">
                  {t('trackInfo.noWaveform')}
                </p>
              )}
            </div>

            <div className="flex flex-col">
              <Row
                label={t('trackInfo.listens')}
                value={
                  <span className="text-primary">
                    {info.stats.listens}
                    {info.stats.listeners > 0 && (
                      <span className="ml-1 font-normal text-muted-foreground">
                        · {t('trackInfo.listeners', { count: info.stats.listeners })}
                      </span>
                    )}
                  </span>
                }
              />
              <Row label={t('trackInfo.downloads')} value={info.stats.downloads} />
              <Row label={t('trackInfo.artist')} value={info.artist} />
              <Row label={t('trackInfo.playlist')} value={info.playlistName} />
              <Row label={t('trackInfo.bpm')} value={v?.bpm ? `${v.bpm}` : null} />
              <Row
                label={t('trackInfo.key')}
                value={formatMusicalKey(v?.musicalKey) || null}
              />
              <Row
                label={t('trackInfo.duration')}
                value={v?.duration ? formatTime(v.duration) : null}
              />
              <Row label={t('trackInfo.filename')} value={v?.originalFilename} />
              <Row
                label={t('trackInfo.fileSize')}
                value={v?.fileSize ? formatBytes(v.fileSize) : null}
              />
              <Row label={t('trackInfo.format')} value={v?.mimeType} />
              <Row
                label={t('trackInfo.versions')}
                value={info.versionCount}
              />
              <Row label={t('trackInfo.mainVersion')} value={v?.label} />
              <Row
                label={t('trackInfo.project')}
                value={
                  v?.projectFilename
                    ? `${v.projectFilename}${
                        v.projectSize ? ` (${formatBytes(v.projectSize)})` : ''
                      }`
                    : null
                }
              />
              <Row
                label={t('trackInfo.uploaded')}
                value={formatDateTime(info.createdAt, locale)}
              />
              <Row
                label={t('trackInfo.updated')}
                value={formatDateTime(info.updatedAt, locale)}
              />
              <Row
                label={t('trackInfo.shared')}
                value={
                  info.shareEnabled || info.projectShareEnabled
                    ? t('trackInfo.yes')
                    : t('trackInfo.no')
                }
              />
              <Row label={t('trackInfo.id')} value={<code className="text-xs">{info._id}</code>} />
            </div>

            {info.description && (
              <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                {info.description}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
