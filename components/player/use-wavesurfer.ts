'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { usePlayer } from '@/lib/player-context'
import { useTheme } from '@/lib/theme-context'
import { getCachedPeaks, storePeaks } from '@/lib/audio-cache'

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
  getCurrentTime: () => number
  subscribeTime: (cb: () => void) => () => void
  duration: number
  peaks: number[]
  ready: boolean
  seekTo: (fraction: number) => void
}

export function useWaveSurfer(
  containerRef: RefObject<HTMLDivElement | null>,
): WaveSurferState {
  const {
    current,
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

  const trackIdRef = useRef<string | null>(null)
  trackIdRef.current = current?.id ?? null
  const currentRef = useRef(current)
  currentRef.current = current
  const listenLoggedForToken = useRef<number>(-1)
  const playTokenRef = useRef(playToken)
  playTokenRef.current = playToken

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

  const currentTimeRef = useRef(0)
  const timeListenersRef = useRef(new Set<() => void>())
  const notifyTime = () => {
    for (const cb of timeListenersRef.current) cb()
  }
  const getCurrentTime = () => currentTimeRef.current
  const subscribeTime = (cb: () => void) => {
    timeListenersRef.current.add(cb)
    return () => {
      timeListenersRef.current.delete(cb)
    }
  }

  const audioCtxRef = useRef<AudioContext | null>(null)
  const pitchNodeRef = useRef<AudioWorkletNode | null>(null)
  const graphStateRef = useRef<'idle' | 'pending' | 'ready' | 'failed'>('idle')

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
      const dur = ws.getDuration()
      setDuration(dur)
      ws.setVolume(volumeRef.current)
      try {
        ws.setPlaybackRate(speedRef.current, true)
      } catch {

      }
      try {
        const exported = ws.exportPeaks({ maxLength: 200 })
        setPeaks(exported?.[0] ? Array.from(exported[0]) : [])
        if (trackIdRef.current) storePeaks(trackIdRef.current, exported, dur)
      } catch {
        setPeaks([])
      }
      setReady(true)
      setIsLoading(false)
      if (shouldPlayRef.current) {
        ws.play().catch(() => {

          void audioCtxRef.current?.resume()
          setTimeout(() => {
            if (shouldPlayRef.current) ws.play().catch(() => {})
          }, 60)
        })
      }
    })
    ws.on('timeupdate', (t: number) => {
      currentTimeRef.current = t
      notifyTime()

      if (
        t >= 15 &&
        listenLoggedForToken.current !== playTokenRef.current &&
        currentRef.current?.onListened
      ) {
        listenLoggedForToken.current = playTokenRef.current
        try {
          currentRef.current.onListened()
        } catch {

        }
      }
    })
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

  useEffect(() => {
    const ws = wsRef.current
    if (!ws || !streamUrl) return
    shouldPlayRef.current = true
    setReady(false)
    setIsLoading(true)
    currentTimeRef.current = 0
    notifyTime()

    const cached = trackIdRef.current ? getCachedPeaks(trackIdRef.current) : {}
    if (cached.peaks) {
      setPeaks(cached.peaks[0] ? Array.from(cached.peaks[0] as ArrayLike<number>) : [])
    } else {
      setPeaks([])
    }

    ws.load(
      streamUrl,
      cached.peaks as (number[] | Float32Array)[] | undefined,
      cached.duration,
    ).catch(() => {

    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl, playToken])

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

  useEffect(() => {
    wsRef.current?.setVolume(volume)
  }, [volume])

  useEffect(() => {
    try {
      wsRef.current?.setPlaybackRate(speed, true)
    } catch {

    }
  }, [speed])

  useEffect(() => {
    if (graphStateRef.current === 'ready') {
      applyPitch(pitch)
      if (audioCtxRef.current?.state === 'suspended') void audioCtxRef.current.resume()
    } else if (pitch !== 0 && graphStateRef.current === 'idle') {
      void setupAudioGraph()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pitch])

  useEffect(() => {
    return () => {
      void audioCtxRef.current?.close()
    }
  }, [])

  useEffect(() => {
    let armed = true
    const unlock = () => {
      if (!armed) return
      armed = false

      const el = wsRef.current?.getMediaElement()
      if (el) {
        const wasPlaying = !el.paused
        el.play()
          .then(() => {
            if (!wasPlaying) el.pause()
          })
          .catch(() => {})
      }
      void audioCtxRef.current?.resume().catch(() => {})
    }
    document.addEventListener('pointerdown', unlock, { once: true, capture: true })
    document.addEventListener('touchend', unlock, { once: true, capture: true })
    return () => {
      document.removeEventListener('pointerdown', unlock, { capture: true })
      document.removeEventListener('touchend', unlock, { capture: true })
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = requestAnimationFrame(() => {
      try {
        wsRef.current?.setOptions(waveColors())
      } catch {

      }
    })
    return () => cancelAnimationFrame(id)
  }, [theme])

  const seekTo = (fraction: number) => {
    const ws = wsRef.current
    if (ws) ws.seekTo(Math.max(0, Math.min(1, fraction)))
  }

  return { getCurrentTime, subscribeTime, duration, peaks, ready, seekTo }
}
