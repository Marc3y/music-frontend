'use client'

import { useEffect, useState } from 'react'

/**
 * Samples the border pixels of a cover image and returns an average `"r g b"`
 * channel string usable in `rgb(... / a)`. Returns null while loading, on error,
 * or when the canvas is tainted (cross-origin without CORS headers) — callers
 * should fall back to a themed glow in that case.
 */
export function useCoverGlow(url: string | null | undefined): string | null {
  const [glow, setGlow] = useState<string | null>(null)

  useEffect(() => {
    setGlow(null)
    if (!url) return

    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      if (cancelled) return
      try {
        const size = 32
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        let r = 0
        let g = 0
        let b = 0
        let n = 0
        const border = 3
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const isEdge =
              x < border || x >= size - border || y < border || y >= size - border
            if (!isEdge) continue
            const i = (y * size + x) * 4
            r += data[i]
            g += data[i + 1]
            b += data[i + 2]
            n++
          }
        }
        if (n === 0 || cancelled) return
        setGlow(`${Math.round(r / n)} ${Math.round(g / n)} ${Math.round(b / n)}`)
      } catch {
        /* tainted canvas — keep the themed fallback */
      }
    }

    img.src = url
    return () => {
      cancelled = true
    }
  }, [url])

  return glow
}
