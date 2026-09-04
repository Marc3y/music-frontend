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
  const {
    streamUrl,
    playToken,
    isPlaying,
    loop,
    volume,
    speed,
    pitch,
    setIsPlaying,
    setIsLoading,
    next,
  } = usePlayer()
  const { theme } = useTheme()

  const wsRef = useRef<WaveSurfer | null>(null)
  const shouldPlayRef = useRef(false)
  const loopRef = useRef(loop)
  const nextRef = useRef(next)
  const volumeRef = useRef(volume)
  const speedRef = useRef(speed)
  loopRef.current = loop
  nextRef.current = next
  volumeRef.current = volume
  speedRef.current = speed

  // Web Audio graph for independent pitch shifting (lazily built on first play).
  const audioCtxRef = useRef<AudioContext | null>(null)
  const pitchNodeRef = useRef<AudioWorkletNode | null>(null)
  const graphStateRef = useRef<'idle' | 'pending' | 'ready' | 'failed'>('idle')

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [peaks, setPeaks] = useState<number[]>([])
  const [ready, setReady] = useState(false)

  const setupAudioGraph = async () => {
    if (graphStateRef.current !== 'idle') return
    const ws = wsRef.current
    const media = ws?.getMediaElement()
    if (!ws || !media || typeof window === 'undefined' || !window.AudioContext) return
    graphStateRef.current = 'pending'
    try {
      const ctx = new AudioContext()
      await ctx.audioWorklet.addModule('/pitch-shift-worklet.js')
      const source = ctx.createMediaElementSource(media)
      const pitchNode = new AudioWorkletNode(ctx, 'phase-vocoder-processor')
      source.connect(pitchNode)
      pitchNode.connect(ctx.destination)
      audioCtxRef.current = ctx
      pitchNodeRef.current = pitchNode
      graphStateRef.current = 'ready'
      applyPitch(pitchRef.current)
    } catch {
      graphStateRef.current = 'failed'
    }
  }

  const applyPitch = (semitones: number) => {
    const param = pitchNodeRef.current?.parameters.get('pitchFactor')
    if (param) param.value = 2 ** (semitones / 12)
  }

  const pitchRef = useRef(pitch)
  pitchRef.current = pitch

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

    const media = ws.getMediaElement()
    if (media) media.crossOrigin = 'anonymous'

    ws.on('ready', () => {
      setDuration(ws.getDuration())
      ws.setVolume(volumeRef.current)
      try {
        ws.setPlaybackRate(speedRef.current, true)
      } catch {
        /* ignore */
      }
      try {
        const exported = ws.exportPeaks({ maxLength: 200 })
        setPeaks(exported?.[0] ? Array.from(exported[0]) : [])
      } catch {
        setPeaks([])
      }
      setReady(true)
      setIsLoading(false)
      if (shouldPlayRef.current) {
        void ws.play()
      }
    })
    ws.on('timeupdate', (t: number) => setCurrentTime(t))
    ws.on('play', () => {
      setIsPlaying(true)
      if (pitchRef.current !== 0 && graphStateRef.current === 'idle') {
        void setupAudioGraph()
      } else if (audioCtxRef.current?.state === 'suspended') {
        void audioCtxRef.current.resume()
      }
    })
    ws.on('pause', () => setIsPlaying(false))
    ws.on('error', () => setIsLoading(false))
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
    setIsLoading(true)
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

  // Tempo — independent of pitch (browser time-stretch keeps pitch constant).
  useEffect(() => {
    try {
      wsRef.current?.setPlaybackRate(speed, true)
    } catch {
      /* ignore */
    }
  }, [speed])

  // Pitch — needs the Web Audio graph; build it on first non-zero value.
  useEffect(() => {
    if (graphStateRef.current === 'ready') {
      applyPitch(pitch)
      if (audioCtxRef.current?.state === 'suspended') void audioCtxRef.current.resume()
    } else if (pitch !== 0 && graphStateRef.current === 'idle') {
      void setupAudioGraph()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pitch])

  // Tear down the audio context on unmount.
  useEffect(() => {
    return () => {
      void audioCtxRef.current?.close()
    }
  }, [])

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
