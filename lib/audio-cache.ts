'use client'

interface Entry {
  blobUrl: string

  peaks?: Array<number[] | Float32Array>
  duration?: number
}

const MAX_ENTRIES = 8
const store = new Map<string, Entry>()
const inflight = new Map<string, Promise<string>>()

function touch(id: string) {
  const entry = store.get(id)
  if (entry) {
    store.delete(id)
    store.set(id, entry)
  }
}

function evict() {
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value as string | undefined
    if (oldest === undefined) break
    const entry = store.get(oldest)
    if (entry) {
      try {
        URL.revokeObjectURL(entry.blobUrl)
      } catch {

      }
    }
    store.delete(oldest)
  }
}

export async function resolveTrackAudio(
  id: string,
  fetchUrl: () => Promise<string>,
): Promise<string> {
  const cached = store.get(id)
  if (cached) {
    touch(id)
    return cached.blobUrl
  }

  const pending = inflight.get(id)
  if (pending) return pending

  const task = (async () => {
    const url = await fetchUrl()
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(String(res.status))
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      store.set(id, { blobUrl })
      evict()
      return blobUrl
    } catch {

      return url
    }
  })()

  inflight.set(id, task)
  try {
    return await task
  } finally {
    inflight.delete(id)
  }
}

export function prefetchTrackAudio(id: string, fetchUrl: () => Promise<string>) {
  if (store.has(id) || inflight.has(id)) return
  void resolveTrackAudio(id, fetchUrl).catch(() => {

  })
}

export function storePeaks(
  id: string,
  peaks: Entry['peaks'],
  duration: number | undefined,
) {
  const entry = store.get(id)
  if (entry) {
    entry.peaks = peaks
    entry.duration = duration
  }
}

export function getCachedPeaks(id: string): {
  peaks?: Entry['peaks']
  duration?: number
} {
  const entry = store.get(id)
  if (!entry) return {}
  return { peaks: entry.peaks, duration: entry.duration }
}
