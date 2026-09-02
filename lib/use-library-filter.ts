'use client'

import { useEffect, useState } from 'react'

export type LibraryFilter = 'all' | 'tracks' | 'projects'

const KEY = 'music.library.filter'

/**
 * Persistierter Playlist-Filter (localStorage, global). SSR-sicher: startet mit
 * 'all' und übernimmt den gespeicherten Wert nach der Hydration.
 */
export function useLibraryFilter(): [LibraryFilter, (next: LibraryFilter) => void] {
  const [filter, setFilterState] = useState<LibraryFilter>('all')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored === 'tracks' || stored === 'projects' || stored === 'all') {
        setFilterState(stored)
      }
    } catch {
      // ignore
    }
  }, [])

  function setFilter(next: LibraryFilter) {
    setFilterState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // ignore
    }
  }

  return [filter, setFilter]
}
