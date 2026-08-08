'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { usePlayer } from '@/lib/player-context'

interface WaveSurferState {
  currentTime: number
  duration: number
  peaks: number[]
  ready: boolean
  seekTo: (fraction: number) => void
}

/**
 * Owns the single WaveSurfer instance used for real audio playback.
 * Reads playback intent from the player context and keeps it in sync.
 */
export function useWaveSurfer(
  containerRef: RefObject<HTMLDivElement | null>,
): WaveSurferState {
  const { streamUrl, playToken, isPlaying, loop, setIsPlaying, next } = usePlayer()

  const wsRef = useRef<WaveSurfer | null>(null)
  const shouldPlayRef = useRef(false)
  const loopRef = useRef(loop)
  const nextRef = useRef(next)
  loopRef.current = loop
  nextRef.current = next

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [peaks, setPeaks] = useState<number[]>([])
  const [ready, setReady] = useState(false)

  // Create the instance once the container exists.
  useEffect(() => {
    if (!containerRef.current || wsRef.current) return

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height: 40,
      waveColor: 'rgba(255,255,255,0.28)',
      progressColor: '#a855f7',
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 2,
      barRadius: 8,
      normalize: true,
      interact: true,
    })
    wsRef.current = ws

    ws.on('ready', () => {
      setDuration(ws.getDuration())
      try {
        const exported = ws.exportPeaks({ maxLength: 200 })
        setPeaks(exported?.[0] ? Array.from(exported[0]) : [])
      } catch {
        setPeaks([])
      }
      setReady(true)
      if (shouldPlayRef.current) {
        void ws.play()
      }
    })
    ws.on('timeupdate', (t: number) => setCurrentTime(t))
    ws.on('play', () => setIsPlaying(true))
    ws.on('pause', () => setIsPlaying(false))
    ws.on('finish', () => {
      if (loopRef.current === 'one') {
        ws.setTime(0)
        void ws.play()
      } else {
        nextRef.current(true)
      }
    })

    return () => {
      ws.destroy()
      wsRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef])

  // Load a new track whenever the stream URL / play token changes.
  useEffect(() => {
    const ws = wsRef.current
    if (!ws || !streamUrl) return
    shouldPlayRef.current = true
    setReady(false)
    setCurrentTime(0)
    setPeaks([])
    ws.load(streamUrl).catch(() => {
      /* load can be aborted when superseded */
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl, playToken])

  // Reflect play/pause intent from the context onto the instance.
  useEffect(() => {
    const ws = wsRef.current
    if (!ws || !ready) return
    shouldPlayRef.current = isPlaying
    if (isPlaying && !ws.isPlaying()) {
      void ws.play()
    } else if (!isPlaying && ws.isPlaying()) {
      ws.pause()
    }
  }, [isPlaying, ready])

  const seekTo = (fraction: number) => {
    const ws = wsRef.current
    if (ws) ws.seekTo(Math.max(0, Math.min(1, fraction)))
  }

  return { currentTime, duration, peaks, ready, seekTo }
}
