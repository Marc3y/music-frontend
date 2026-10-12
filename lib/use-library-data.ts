'use client'

import { useEffect, useState } from 'react'
import { accountApi, playlistApi, ApiError } from '@/lib/api'
import type { Playlist, SavedShare, StorageSummary } from '@/lib/types'

const cache: {
  playlists: Playlist[] | null
  saved: SavedShare[]
  storage: StorageSummary | null
} = { playlists: null, saved: [], storage: null }

export function useLibraryData() {
  const [playlists, setPlaylistsState] = useState<Playlist[] | null>(cache.playlists)
  const [saved, setSavedState] = useState<SavedShare[]>(cache.saved)
  const [storage, setStorageState] = useState<StorageSummary | null>(cache.storage)

  useEffect(() => {
    let cancelled = false

    playlistApi
      .list()
      .then((data) => {
        if (cancelled) return
        cache.playlists = data
        setPlaylistsState(data)
      })
      .catch((err) => {
        if (cancelled) return
        if (cache.playlists === null) {
          setPlaylistsState([])
          throw err instanceof ApiError ? err : new Error('load failed')
        }
      })
      .catch(() => {})

    accountApi
      .storage()
      .then((s) => {
        if (cancelled) return
        cache.storage = s
        setStorageState(s)
      })
      .catch(() => {})

    accountApi
      .savedShares()
      .then((s) => {
        if (cancelled) return
        cache.saved = s
        setSavedState(s)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  function setPlaylists(updater: (prev: Playlist[]) => Playlist[]) {
    const next = updater(cache.playlists ?? [])
    cache.playlists = next
    setPlaylistsState(next)
  }

  function setSaved(updater: (prev: SavedShare[]) => SavedShare[]) {
    const next = updater(cache.saved)
    cache.saved = next
    setSavedState(next)
  }

  return { playlists, saved, storage, setPlaylists, setSaved }
}
