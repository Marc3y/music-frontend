'use client'

import { useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ChevronDown,
  Loader2,
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import { usePlayer } from '@/lib/player-context'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useWaveSurfer } from './use-wavesurfer'
import { BarsWaveform } from './bars-waveform'

export function GlobalPlayer() {
  const player = usePlayer()
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentTime, duration, peaks, seekTo } = useWaveSurfer(containerRef)

  const { current, isPlaying, isLoading, shuffle, loop, expanded } = player
  const progress = duration > 0 ? currentTime / duration : 0
  const hasTrack = Boolean(current)

  return (
    <>
      {/* Expanded full-screen view */}
      <AnimatePresence>
        {expanded && current && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[70] flex flex-col bg-background"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  'radial-gradient(120% 80% at 50% -10%, oklch(0.55 0.27 295 / 0.35), transparent 60%)',
              }}
            />
            <div className="relative z-10 flex items-center justify-between p-4 sm:p-6">
              <button
                onClick={() => player.setExpanded(false)}
                className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Player schließen"
              >
                <ChevronDown className="size-6" />
              </button>
              <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Wiedergabe
              </span>
              <div className="size-10" />
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-10">
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative aspect-square w-full max-w-xs overflow-hidden rounded-3xl glow-primary"
              >
                {current.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.coverUrl || '/placeholder.svg'}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/30 to-accent/20">
                    <Music className="size-20 text-foreground/40" />
                  </div>
                )}
              </motion.div>

              <div className="w-full max-w-md text-center">
                <h2 className="truncate text-2xl font-semibold text-balance">
                  {current.title}
                </h2>
                <p className="mt-1 truncate text-muted-foreground">
                  {current.artist || 'Unbekannter Interpret'}
                </p>
              </div>

              <div className="w-full max-w-md">
                <BarsWaveform peaks={peaks} progress={progress} onSeek={seekTo} />
                <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration || current.duration)}</span>
                </div>
              </div>

              <Controls player={player} isPlaying={isPlaying} isLoading={isLoading} large />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini bar (always mounted so wavesurfer keeps its container) */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-[60] transition-transform duration-500',
          hasTrack ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="mx-auto max-w-6xl px-3 pb-3 sm:px-4 sm:pb-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/80 p-2.5 shadow-2xl backdrop-blur-xl sm:gap-4 sm:p-3">
            <button
              onClick={() => player.setExpanded(true)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition-opacity hover:opacity-80"
              aria-label="Player vergrößern"
            >
              <div className="relative size-11 shrink-0 overflow-hidden rounded-lg sm:size-12">
                {current?.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.coverUrl || '/placeholder.svg'}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/30 to-accent/20">
                    <Music className="size-5 text-foreground/50" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {current?.title || 'Kein Titel'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {current?.artist || 'Unbekannter Interpret'}
                </p>
              </div>
            </button>

            {/* Real waveform lives here (hidden on small screens, container stays mounted) */}
            <div className="hidden min-w-0 flex-1 md:block">
              <div ref={containerRef} className="w-full" />
            </div>

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <IconButton
                onClick={player.toggleShuffle}
                active={shuffle}
                label="Zufallswiedergabe"
                className="hidden sm:inline-flex"
              >
                <Shuffle className="size-4" />
              </IconButton>
              <IconButton onClick={player.prev} label="Vorheriger Titel">
                <SkipBack className="size-5" />
              </IconButton>
              <button
                onClick={player.togglePlay}
                className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
                aria-label={isPlaying ? 'Pause' : 'Abspielen'}
              >
                {isLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="size-5" />
                ) : (
                  <Play className="size-5 translate-x-px" />
                )}
              </button>
              <IconButton onClick={() => player.next()} label="Nächster Titel">
                <SkipForward className="size-5" />
              </IconButton>
              <IconButton
                onClick={player.cycleLoop}
                active={loop !== 'none'}
                label="Wiederholen"
                className="hidden sm:inline-flex"
              >
                {loop === 'one' ? (
                  <Repeat1 className="size-4" />
                ) : (
                  <Repeat className="size-4" />
                )}
              </IconButton>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function IconButton({
  children,
  onClick,
  active,
  label,
  className,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  label: string
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full transition-colors',
        active
          ? 'text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}

function Controls({
  player,
  isPlaying,
  isLoading,
  large,
}: {
  player: ReturnType<typeof usePlayer>
  isPlaying: boolean
  isLoading: boolean
  large?: boolean
}) {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5">
      <IconButton
        onClick={player.toggleShuffle}
        active={player.shuffle}
        label="Zufallswiedergabe"
      >
        <Shuffle className="size-5" />
      </IconButton>
      <button
        onClick={player.prev}
        aria-label="Vorheriger Titel"
        className="inline-flex size-12 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
      >
        <SkipBack className="size-6" />
      </button>
      <button
        onClick={player.togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Abspielen'}
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95',
          large ? 'size-16' : 'size-12',
        )}
      >
        {isLoading ? (
          <Loader2 className={cn(large ? 'size-7' : 'size-6', 'animate-spin')} />
        ) : isPlaying ? (
          <Pause className={large ? 'size-7' : 'size-6'} />
        ) : (
          <Play className={cn(large ? 'size-7' : 'size-6', 'translate-x-0.5')} />
        )}
      </button>
      <button
        onClick={() => player.next()}
        aria-label="Nächster Titel"
        className="inline-flex size-12 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
      >
        <SkipForward className="size-6" />
      </button>
      <IconButton
        onClick={player.cycleLoop}
        active={player.loop !== 'none'}
        label="Wiederholen"
      >
        {player.loop === 'one' ? (
          <Repeat1 className="size-5" />
        ) : (
          <Repeat className="size-5" />
        )}
      </IconButton>
    </div>
  )
}
