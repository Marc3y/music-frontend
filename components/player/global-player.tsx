'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import {
  ChevronDown,
  Loader2,
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  RotateCcw,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePlayer } from '@/lib/player-context'
import { audioApi, ApiError } from '@/lib/api'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ease, spring } from '@/lib/motion'
import { useCoverGlow } from '@/lib/use-cover-glow'
import { useT } from '@/lib/i18n/context'
import { Slider } from '@/components/ui/slider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ShareTrackDialog } from '@/components/app/share-track-dialog'
import type { AudioFile } from '@/lib/types'
import { useWaveSurfer } from './use-wavesurfer'
import { BarsWaveform } from './bars-waveform'

const OBJECT_ID = /^[a-f\d]{24}$/i

export function GlobalPlayer() {
  const player = usePlayer()
  const t = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentTime, duration, peaks, seekTo } = useWaveSurfer(containerRef)

  const { current, isPlaying, isLoading, shuffle, loop, expanded } = player
  const progress = duration > 0 ? currentTime / duration : 0
  const hasTrack = Boolean(current)
  const coverGlow = useCoverGlow(current?.coverUrl)

  const [sharingTrack, setSharingTrack] = useState<AudioFile | null>(null)
  const [loadingShare, setLoadingShare] = useState(false)
  const canShare = Boolean(current && OBJECT_ID.test(current.id))

  function handleDismissDragEnd(_e: unknown, info: PanInfo) {
    if (info.offset.y > 120 || info.velocity.y > 600) {
      player.setExpanded(false)
    }
  }

  async function openShare() {
    if (!current || loadingShare) return
    setLoadingShare(true)
    try {
      setSharingTrack(await audioApi.get(current.id))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('shareTrack.enableFailed'))
    } finally {
      setLoadingShare(false)
    }
  }

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
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            dragTransition={{ bounceStiffness: 500, bounceDamping: 40 }}
            onDragEnd={handleDismissDragEnd}
            className="fixed inset-0 z-[70] flex flex-col bg-background"
          >
            <div className="relative z-10 flex shrink-0 touch-none justify-center pt-2.5 pb-1">
              <span className="h-1.5 w-10 rounded-full bg-muted-foreground/25" />
            </div>
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
                aria-label={t('player.close')}
              >
                <ChevronDown className="size-6" />
              </motion.button>
              <span className="text-[0.7rem] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                {t('player.playback')}
              </span>
              <div className="flex items-center gap-1">
                {canShare && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={openShare}
                    disabled={loadingShare}
                    aria-label={t('player.share')}
                    className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                  >
                    {loadingShare ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Share2 className="size-4" />
                    )}
                  </motion.button>
                )}
                <PlaybackFxMenu />
              </div>
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:gap-9 sm:pb-10">
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
                  {current.artist || t('player.unknownArtist')}
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

              <VolumeControl
                onPointerDownCapture={(e) => e.stopPropagation()}
                className="hidden w-full max-w-[220px] sm:flex"
              />
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
        <div className="mx-auto max-w-xl px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="glass relative overflow-hidden rounded-2xl shadow-(--elevate-3)">
                <div className="flex items-center gap-3 p-2.5 sm:gap-4 sm:p-3">
                  <button
                    onClick={() => player.setExpanded(true)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition-opacity hover:opacity-80"
                    aria-label={t('player.expand')}
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
                        {current?.title || t('player.noTitle')}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {current?.artist || t('player.unknownArtist')}
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
                      label={t('player.shuffle')}
                      className="hidden size-8 sm:inline-flex"
                    >
                      <Shuffle className="size-3.5" />
                    </IconButton>
                    <IconButton onClick={player.prev} label={t('player.previous')} className="size-8">
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
                      label={t('player.next')}
                      className="size-8"
                    >
                      <SkipForward className="size-4" />
                    </IconButton>
                    <IconButton
                      onClick={player.cycleLoop}
                      active={loop !== 'none'}
                      label={t('player.repeat')}
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

      <ShareTrackDialog
        track={sharingTrack}
        open={sharingTrack !== null}
        onOpenChange={(open) => !open && setSharingTrack(null)}
        onUpdated={(updated) => setSharingTrack(updated)}
      />
    </>
  )
}

function PlaybackFxMenu() {
  const { speed, pitch, setSpeed, setPitch, resetPlaybackFx } = usePlayer()
  const t = useT()
  const active = speed !== 1 || pitch !== 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('player.playbackFx')}
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-full outline-none transition-colors hover:bg-muted',
          active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <SlidersHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-3">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>{t('player.speed')}</span>
              <span className="font-mono text-muted-foreground tabular-nums">
                {speed.toFixed(2)}×
              </span>
            </div>
            <Slider
              value={[speed]}
              min={0.5}
              max={1.5}
              step={0.05}
              onValueChange={(v) => setSpeed((Array.isArray(v) ? v[0] : v) ?? 1)}
              aria-label={t('player.speed')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>{t('player.pitch')}</span>
              <span className="font-mono text-muted-foreground tabular-nums">
                {pitch > 0 ? `+${pitch}` : pitch} st
              </span>
            </div>
            <Slider
              value={[pitch]}
              min={-7}
              max={7}
              step={1}
              onValueChange={(v) => setPitch((Array.isArray(v) ? v[0] : v) ?? 0)}
              aria-label={t('player.pitch')}
            />
          </div>
          <DropdownMenuItem
            closeOnClick={false}
            disabled={!active}
            onClick={resetPlaybackFx}
            className="justify-center"
          >
            <RotateCcw className="size-3.5" />
            {t('player.resetFx')}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
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
  const t = useT()
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      transition={{ duration: 0.12, ease: ease.apple }}
      aria-label={isPlaying ? t('player.pause') : t('player.play')}
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

function VolumeControl({
  className,
  ...divProps
}: React.ComponentProps<'div'>) {
  const { volume, setVolume } = usePlayer()
  const t = useT()
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
    <div className={cn('flex items-center gap-2', className)} {...divProps}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleMute}
        aria-label={volume === 0 ? t('player.unmute') : t('player.mute')}
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
        aria-label={t('player.volume')}
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
  const t = useT()
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <IconButton
        onClick={player.toggleShuffle}
        active={player.shuffle}
        label={t('player.shuffle')}
      >
        <Shuffle className="size-5" />
      </IconButton>

      <div className="flex items-center gap-1 rounded-full bg-secondary/60 p-1.5">
        <IconButton onClick={player.prev} label={t('player.previous')} className="size-11">
          <SkipBack className="size-6" />
        </IconButton>
        <PlayButton
          isPlaying={isPlaying}
          isLoading={isLoading}
          onClick={player.togglePlay}
          size={large ? 'lg' : 'sm'}
        />
        <IconButton onClick={() => player.next()} label={t('player.next')} className="size-11">
          <SkipForward className="size-6" />
        </IconButton>
      </div>

      <IconButton
        onClick={player.cycleLoop}
        active={player.loop !== 'none'}
        label={t('player.repeat')}
      >
        {player.loop === 'one' ? <Repeat1 className="size-5" /> : <Repeat className="size-5" />}
      </IconButton>
    </div>
  )
}
