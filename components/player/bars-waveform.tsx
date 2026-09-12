'use client'

import { memo, useMemo, type MouseEvent } from 'react'
import { cn } from '@/lib/utils'

const Bar = memo(function Bar({ height, played }: { height: number; played: boolean }) {
  return (
    <div
      className={cn(
        'flex-1 rounded-full transition-[background-color,transform] duration-200 ease-apple',
        played ? 'bg-primary' : 'bg-muted-foreground/25',
      )}
      style={{
        height: `${Math.round(height * 100)}%`,
        transform: played ? 'scaleY(1)' : 'scaleY(0.86)',
        transformOrigin: 'center',
      }}
    />
  )
})

interface BarsWaveformProps {
  peaks: number[]
  progress: number // 0..1
  onSeek?: (fraction: number) => void
  className?: string
  barCount?: number
}

/**
 * A decorative, progress-synced bar waveform for the expanded player view.
 * Falls back to a generated shape until real peaks are available.
 */
export function BarsWaveform({
  peaks,
  progress,
  onSeek,
  className,
  barCount = 72,
}: BarsWaveformProps) {
  const bars = useMemo(() => {
    const source = peaks.length > 0 ? peaks.map(Math.abs) : null
    const result: number[] = []
    for (let i = 0; i < barCount; i++) {
      if (source && source.length > 0) {
        const idx = Math.floor((i / barCount) * source.length)
        result.push(source[idx] ?? 0)
      } else {
        // pseudo-random but stable placeholder shape
        result.push(0.25 + Math.abs(Math.sin(i * 0.6)) * 0.6)
      }
    }
    const max = Math.max(...result, 0.0001)
    return result.map((v) => Math.max(0.06, v / max))
  }, [peaks, barCount])

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return
    const rect = e.currentTarget.getBoundingClientRect()
    onSeek((e.clientX - rect.left) / rect.width)
  }

  return (
    <div
      className={cn(
        'flex h-24 w-full items-center gap-[3px]',
        onSeek && 'cursor-pointer',
        className,
      )}
      onClick={handleClick}
      role={onSeek ? 'slider' : undefined}
      aria-label={onSeek ? 'Wiedergabeposition' : undefined}
      aria-valuenow={Math.round(progress * 100)}
    >
      {bars.map((h, i) => (
        <Bar key={i} height={h} played={i / barCount <= progress} />
      ))}
    </div>
  )
}
