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
  /** Bumped whenever the current track should (re)start from the beginning. */
  playToken: number
  playQueue: (tracks: PlayerTrack[], startIndex?: number) => void
  togglePlay: () => void
  setIsPlaying: (playing: boolean) => void
  next: (auto?: boolean) => void
  prev: () => void
  toggleShuffle: () => void
  cycleLoop: () => void
  setExpanded: (open: boolean) => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

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

  const queueRef = useRef<PlayerTrack[]>([])
  const requestIdRef = useRef(0)
  queueRef.current = queue

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
    } catch (err) {
      if (reqId !== requestIdRef.current) return
      toast.error(err instanceof Error ? err.message : 'Wiedergabe fehlgeschlagen')
      setIsPlaying(false)
    } finally {
      if (reqId === requestIdRef.current) setIsLoading(false)
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
      playToken,
      playQueue,
      togglePlay,
      setIsPlaying,
      next,
      prev,
      toggleShuffle,
      cycleLoop,
      setExpanded,
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
      playToken,
      playQueue,
      togglePlay,
      next,
      prev,
      toggleShuffle,
      cycleLoop,
    ],
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
