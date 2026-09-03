'use client'

import { useRef, useState } from 'react'
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
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { usePlayer } from '@/lib/player-context'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ease, spring } from '@/lib/motion'
import { useCoverGlow } from '@/lib/use-cover-glow'
import { Slider } from '@/components/ui/slider'
import { useWaveSurfer } from './use-wavesurfer'
import { BarsWaveform } from './bars-waveform'

export function GlobalPlayer() {
  const player = usePlayer()
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentTime, duration, peaks, seekTo } = useWaveSurfer(containerRef)

  const { current, isPlaying, isLoading, shuffle, loop, expanded } = player
  const progress = duration > 0 ? currentTime / duration : 0
  const hasTrack = Boolean(current)
  const coverGlow = useCoverGlow(current?.coverUrl)

  return (
    <>
      {/* Expanded full-screen view */}
      <AnimatePresence>
        {expanded && current && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.46, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-[70] flex flex-col bg-background"
          >
            <div
              className="pointer-events-none absolute inset-0 transition-[background] duration-700 ease-out"
              style={{
                background: coverGlow
                  ? `radial-gradient(120% 62% at 50% -8%, rgb(${coverGlow} / 0.5), transparent 60%)`
                  : 'radial-gradient(110% 60% at 50% -5%, var(--glow-cool), transparent 62%)',
              }}
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 transition-[background] duration-700 ease-out"
              style={{
                background: coverGlow
                  ? `radial-gradient(80% 100% at 78% 100%, rgb(${coverGlow} / 0.32), transparent 70%)`
                  : 'radial-gradient(80% 100% at 80% 100%, var(--glow-warm), transparent 70%)',
              }}
            />

            <div className="relative z-10 flex items-center justify-between p-4 sm:p-6">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => player.setExpanded(false)}
                className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Player schließen"
              >
                <ChevronDown className="size-6" />
              </motion.button>
              <span className="text-[0.7rem] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                Wiedergabe
              </span>
              <div className="size-10" />
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-9 px-6 pb-10">
              <motion.div
                initial={{ scale: 0.86, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ ...spring.soft, delay: 0.08 }}
                style={
                  coverGlow
                    ? {
                        boxShadow: `0 32px 120px -24px rgb(${coverGlow} / 0.65), 0 0 60px -12px rgb(${coverGlow} / 0.45)`,
                      }
                    : undefined
                }
                className={cn(
                  'relative aspect-square w-full max-w-[19rem] overflow-hidden rounded-[2rem] transition-shadow duration-700 ease-out',
                  !coverGlow && 'glow-primary',
                )}
              >
                {current.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={current.coverUrl} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/25 to-accent/20">
                    <Music className="size-20 text-foreground/40" />
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.16, ease: ease.out }}
                className="w-full max-w-md text-center"
              >
                <h2 className="truncate text-2xl font-semibold tracking-tight text-balance">
                  {current.title}
                </h2>
                <p className="mt-1 truncate text-muted-foreground">
                  {current.artist || 'Unbekannter Interpret'}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.22, ease: ease.out }}
                className="w-full max-w-md"
              >
                <BarsWaveform peaks={peaks} progress={progress} onSeek={seekTo} />
                <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground tabular-nums">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration || current.duration)}</span>
                </div>
              </motion.div>

              <Controls player={player} isPlaying={isPlaying} isLoading={isLoading} large />

              <VolumeControl className="w-full max-w-[220px]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini bar (always mounted so wavesurfer keeps its container) */}
      <motion.div
        initial={false}
        animate={{ y: hasTrack ? 0 : 96, opacity: hasTrack ? 1 : 0 }}
        transition={spring.soft}
        className={cn(
          'fixed inset-x-0 bottom-0 z-[60]',
          !hasTrack && 'pointer-events-none',
        )}
      >
        <div className="mx-auto max-w-xl px-3 pb-3 sm:px-4 sm:pb-4">
          <div className="glass relative overflow-hidden rounded-2xl shadow-(--elevate-3)">
                <div className="flex items-center gap-3 p-2.5 sm:gap-4 sm:p-3">
                  <button
                    onClick={() => player.setExpanded(true)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition-opacity hover:opacity-80"
                    aria-label="Player vergrößern"
                  >
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-border/70 sm:size-12">
                      {current?.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={current.coverUrl} alt="" className="size-full object-cover" />
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
                  <div className="hidden min-w-0 max-w-[9rem] flex-1 md:block lg:max-w-[12rem]">
                    <div ref={containerRef} className="w-full" />
                  </div>

                  <VolumeControl className="hidden w-24 shrink-0 xl:flex" />

                  {/* transport pill */}
                  <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-secondary/60 p-1">
                    <IconButton
                      onClick={player.toggleShuffle}
                      active={shuffle}
                      label="Zufallswiedergabe"
                      className="hidden size-8 sm:inline-flex"
                    >
                      <Shuffle className="size-3.5" />
                    </IconButton>
                    <IconButton onClick={player.prev} label="Vorheriger Titel" className="size-8">
                      <SkipBack className="size-4" />
                    </IconButton>
                    <PlayButton
                      isPlaying={isPlaying}
                      isLoading={isLoading}
                      onClick={player.togglePlay}
                      size="sm"
                    />
                    <IconButton
                      onClick={() => player.next()}
                      label="Nächster Titel"
                      className="size-8"
                    >
                      <SkipForward className="size-4" />
                    </IconButton>
                    <IconButton
                      onClick={player.cycleLoop}
                      active={loop !== 'none'}
                      label="Wiederholen"
                      className="hidden size-8 sm:inline-flex"
                    >
                      {loop === 'one' ? (
                        <Repeat1 className="size-3.5" />
                      ) : (
                        <Repeat className="size-3.5" />
                      )}
                    </IconButton>
                  </div>
                </div>
              </div>
            </div>
      </motion.div>
    </>
  )
}

function PlayButton({
  isPlaying,
  isLoading,
  onClick,
  size,
}: {
  isPlaying: boolean
  isLoading: boolean
  onClick: () => void
  size: 'sm' | 'lg'
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      transition={{ duration: 0.12, ease: ease.apple }}
      aria-label={isPlaying ? 'Pause' : 'Abspielen'}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-(--elevate-2)',
        size === 'lg' ? 'size-16' : 'size-9',
      )}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={isLoading ? 'load' : isPlaying ? 'pause' : 'play'}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.16, ease: ease.out }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isLoading ? (
            <Loader2 className={cn(size === 'lg' ? 'size-7' : 'size-4', 'animate-spin')} />
          ) : isPlaying ? (
            <Pause className={size === 'lg' ? 'size-7' : 'size-4'} />
          ) : (
            <Play className={cn(size === 'lg' ? 'size-7' : 'size-4', 'translate-x-px')} />
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

function VolumeControl({ className }: { className?: string }) {
  const { volume, setVolume } = usePlayer()
  const [previousVolume, setPreviousVolume] = useState(1)

  function toggleMute() {
    if (volume > 0) {
      setPreviousVolume(volume)
      setVolume(0)
    } else {
      setVolume(previousVolume || 1)
    }
  }

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleMute}
        aria-label={volume === 0 ? 'Stummschaltung aufheben' : 'Stummschalten'}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <VolumeIcon className="size-4" />
      </motion.button>
      <Slider
        value={[Math.round(volume * 100)]}
        max={100}
        min={0}
        onValueChange={(value) => {
          const v = Array.isArray(value) ? value[0] : value
          setVolume((v ?? 0) / 100)
        }}
        aria-label="Lautstärke"
        className="w-full"
      />
    </div>
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
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.85 }}
      transition={{ duration: 0.12, ease: ease.apple }}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full transition-colors',
        active ? 'text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      {children}
    </motion.button>
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
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <IconButton
        onClick={player.toggleShuffle}
        active={player.shuffle}
        label="Zufallswiedergabe"
      >
        <Shuffle className="size-5" />
      </IconButton>

      <div className="flex items-center gap-1 rounded-full bg-secondary/60 p-1.5">
        <IconButton onClick={player.prev} label="Vorheriger Titel" className="size-11">
          <SkipBack className="size-6" />
        </IconButton>
        <PlayButton
          isPlaying={isPlaying}
          isLoading={isLoading}
          onClick={player.togglePlay}
          size={large ? 'lg' : 'sm'}
        />
        <IconButton onClick={() => player.next()} label="Nächster Titel" className="size-11">
          <SkipForward className="size-6" />
        </IconButton>
      </div>

      <IconButton
        onClick={player.cycleLoop}
        active={player.loop !== 'none'}
        label="Wiederholen"
      >
        {player.loop === 'one' ? <Repeat1 className="size-5" /> : <Repeat className="size-5" />}
      </IconButton>
    </div>
  )
}
