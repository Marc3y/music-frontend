'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { usePlayer } from '@/lib/player-context'
import { useTheme } from '@/lib/theme-context'

function waveColors() {
  if (typeof window === 'undefined') {
    return { waveColor: 'rgba(120,120,140,0.3)', progressColor: '#5b6ee0' }
  }
  const cs = getComputedStyle(document.documentElement)
  const primary = cs.getPropertyValue('--primary').trim() || '#5b6ee0'
  const mutedFg = cs.getPropertyValue('--muted-foreground').trim() || '#8a8a9c'
  return {
    waveColor: `color-mix(in oklch, ${mutedFg}, transparent 62%)`,
    progressColor: primary,
  }
}

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
  const { streamUrl, playToken, isPlaying, loop, volume, setIsPlaying, next } = usePlayer()
  const { theme } = useTheme()

  const wsRef = useRef<WaveSurfer | null>(null)
  const shouldPlayRef = useRef(false)
  const loopRef = useRef(loop)
  const nextRef = useRef(next)
  const volumeRef = useRef(volume)
  loopRef.current = loop
  nextRef.current = next
  volumeRef.current = volume

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
      ...waveColors(),
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 2,
      barRadius: 8,
      normalize: true,
      interact: true,
      volume: volumeRef.current,
    })
    wsRef.current = ws

    ws.on('ready', () => {
      setDuration(ws.getDuration())
      ws.setVolume(volumeRef.current)
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

  // Reflect volume changes immediately, even mid-playback.
  useEffect(() => {
    wsRef.current?.setVolume(volume)
  }, [volume])

  // Re-tint the waveform when the theme changes (no reload).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = requestAnimationFrame(() => {
      try {
        wsRef.current?.setOptions(waveColors())
      } catch {
        /* ignore */
      }
    })
    return () => cancelAnimationFrame(id)
  }, [theme])

  const seekTo = (fraction: number) => {
    const ws = wsRef.current
    if (ws) ws.seekTo(Math.max(0, Math.min(1, fraction)))
  }

  return { currentTime, duration, peaks, ready, seekTo }
}
