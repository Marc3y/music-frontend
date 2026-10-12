'use client'

import { useEffect, useState } from 'react'

export type LibraryFilter = 'all' | 'tracks' | 'projects'

const KEY = 'music.library.filter'

export function useLibraryFilter(): [LibraryFilter, (next: LibraryFilter) => void] {
  const [filter, setFilterState] = useState<LibraryFilter>('all')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored === 'tracks' || stored === 'projects' || stored === 'all') {
        setFilterState(stored)
      }
    } catch {

    }
  }, [])

  function setFilter(next: LibraryFilter) {
    setFilterState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {

    }
  }

  return [filter, setFilter]
}
