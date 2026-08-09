'use client'

import Link from 'next/link'
import { Music } from 'lucide-react'
import type { Playlist } from '@/lib/types'

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Link
      href={`/library/${playlist._id}`}
      className="group flex flex-col gap-3 rounded-2xl p-2 transition-colors hover:bg-card/60"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/25 to-accent/15 shadow-lg transition-transform duration-300 group-hover:scale-[1.02]">
        {playlist.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={playlist.coverUrl || '/placeholder.svg'}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Music className="size-10 text-foreground/40" />
          </div>
        )}
      </div>
      <div className="min-w-0 px-1">
        <p className="truncate text-sm font-medium">{playlist.name}</p>
        <p className="text-xs text-muted-foreground">Playlist</p>
      </div>
    </Link>
  )
}
