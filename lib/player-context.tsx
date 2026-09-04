'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'

export type LoopMode = 'none' | 'all' | 'one'

export interface PlayerTrack {
  id: string
  title: string
  artist?: string
  coverUrl?: string | null
  duration?: number
  /** Resolves a fresh (short-lived) stream URL every time playback (re)starts. */
  getStreamUrl: () => Promise<string>
}

interface PlayerContextValue {
  queue: PlayerTrack[]
  index: number
  current: PlayerTrack | null
  streamUrl: string | null
  isPlaying: boolean
  isLoading: boolean
  shuffle: boolean
  loop: LoopMode
  expanded: boolean
  volume: number
  /** Playback tempo, 1 = normal. Session-only, resets on full reload. */
  speed: number
  /** Pitch shift in semitones, 0 = unchanged. Session-only. */
  pitch: number
  /** Bumped whenever the current track should (re)start from the beginning. */
  playToken: number
  playQueue: (tracks: PlayerTrack[], startIndex?: number) => void
  togglePlay: () => void
  setIsPlaying: (playing: boolean) => void
  /** Owned by the wavesurfer instance once a stream URL resolves — stays true until it reports 'ready'. */
  setIsLoading: (loading: boolean) => void
  next: (auto?: boolean) => void
  prev: () => void
  toggleShuffle: () => void
  cycleLoop: () => void
  setExpanded: (open: boolean) => void
  setVolume: (volume: number) => void
  setSpeed: (speed: number) => void
  setPitch: (semitones: number) => void
  resetPlaybackFx: () => void
  /**
   * Patches display metadata (title/artist/coverUrl) of a track that is
   * currently in the queue, without touching playback state. Used so that
   * editing a track's info or cover reflects live in the player instead of
   * requiring a reload.
   */
  patchTrack: (id: string, patch: Partial<Omit<PlayerTrack, 'id' | 'getStreamUrl'>>) => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

const VOLUME_STORAGE_KEY = 'player-volume'

function getInitialVolume(): number {
  if (typeof window === 'undefined') return 1
  const stored = window.localStorage.getItem(VOLUME_STORAGE_KEY)
  const parsed = stored ? Number(stored) : NaN
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 1
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<PlayerTrack[]>([])
  const [index, setIndex] = useState(-1)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [loop, setLoop] = useState<LoopMode>('none')
  const [expanded, setExpanded] = useState(false)
  const [playToken, setPlayToken] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [speed, setSpeedState] = useState(1)
  const [pitch, setPitchState] = useState(0)

  const queueRef = useRef<PlayerTrack[]>([])
  const requestIdRef = useRef(0)
  const volumeInitialized = useRef(false)
  queueRef.current = queue

  if (!volumeInitialized.current && typeof window !== 'undefined') {
    volumeInitialized.current = true
    const initial = getInitialVolume()
    if (initial !== volume) setVolumeState(initial)
  }

  const current = index >= 0 && index < queue.length ? queue[index] : null

  const loadIndex = useCallback(async (tracks: PlayerTrack[], i: number) => {
    const track = tracks[i]
    if (!track) return
    const reqId = ++requestIdRef.current
    setIndex(i)
    setIsLoading(true)
    setStreamUrl(null)
    try {
      const url = await track.getStreamUrl()
      if (reqId !== requestIdRef.current) return // superseded
      setStreamUrl(url)
      setPlayToken((t) => t + 1)
      setIsPlaying(true)
      // isLoading stays true — the wavesurfer instance clears it once the
      // audio has actually finished downloading/decoding and is ready to play.
    } catch (err) {
      if (reqId !== requestIdRef.current) return
      toast.error(err instanceof Error ? err.message : 'Wiedergabe fehlgeschlagen')
      setIsPlaying(false)
      setIsLoading(false)
    }
  }, [])

  const playQueue = useCallback(
    (tracks: PlayerTrack[], startIndex = 0) => {
      setQueue(tracks)
      queueRef.current = tracks
      void loadIndex(tracks, startIndex)
    },
    [loadIndex],
  )

  const togglePlay = useCallback(() => {
    if (!current) return
    setIsPlaying((p) => !p)
  }, [current])

  const next = useCallback(
    (auto = false) => {
      const tracks = queueRef.current
      if (tracks.length === 0) return
      // A single-track queue has nowhere to advance to — restart it instead of
      // doing nothing (only auto-stop at the end when not repeating).
      if (tracks.length === 1) {
        if (auto && loop !== 'all') {
          setIsPlaying(false)
          return
        }
        void loadIndex(tracks, 0)
        return
      }
      let nextIndex: number
      if (shuffle && tracks.length > 1) {
        do {
          nextIndex = Math.floor(Math.random() * tracks.length)
        } while (nextIndex === index)
      } else {
        nextIndex = index + 1
        if (nextIndex >= tracks.length) {
          if (loop === 'all') {
            nextIndex = 0
          } else {
            if (auto) setIsPlaying(false)
            return
          }
        }
      }
      void loadIndex(tracks, nextIndex)
    },
    [shuffle, index, loop, loadIndex],
  )

  const prev = useCallback(() => {
    const tracks = queueRef.current
    if (tracks.length === 0) return
    const prevIndex = index - 1 < 0 ? 0 : index - 1
    void loadIndex(tracks, prevIndex)
  }, [index, loadIndex])

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), [])
  const cycleLoop = useCallback(
    () =>
      setLoop((l) => (l === 'none' ? 'all' : l === 'all' ? 'one' : 'none')),
    [],
  )

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v))
    setVolumeState(clamped)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped))
    }
  }, [])

  const setSpeed = useCallback((v: number) => {
    setSpeedState(Math.min(3, Math.max(0.5, Math.round(v * 100) / 100)))
  }, [])
  const setPitch = useCallback((v: number) => {
    setPitchState(Math.min(12, Math.max(-12, Math.round(v))))
  }, [])
  const resetPlaybackFx = useCallback(() => {
    setSpeedState(1)
    setPitchState(0)
  }, [])

  const patchTrack = useCallback(
    (id: string, patch: Partial<Omit<PlayerTrack, 'id' | 'getStreamUrl'>>) => {
      setQueue((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    },
    [],
  )

  const value = useMemo<PlayerContextValue>(
    () => ({
      queue,
      index,
      current,
      streamUrl,
      isPlaying,
      isLoading,
      shuffle,
      loop,
      expanded,
      volume,
      speed,
      pitch,
      playToken,
      playQueue,
      togglePlay,
      setIsPlaying,
      setIsLoading,
      next,
      prev,
      toggleShuffle,
      cycleLoop,
      setExpanded,
      setVolume,
      setSpeed,
      setPitch,
      resetPlaybackFx,
      patchTrack,
    }),
    [
      queue,
      index,
      current,
      streamUrl,
      isPlaying,
      isLoading,
      shuffle,
      loop,
      expanded,
      volume,
      speed,
      pitch,
      playToken,
      playQueue,
      togglePlay,
      next,
      prev,
      toggleShuffle,
      cycleLoop,
      setVolume,
      setSpeed,
      setPitch,
      resetPlaybackFx,
      patchTrack,
    ],
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
