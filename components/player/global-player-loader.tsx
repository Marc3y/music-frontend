'use client'

import dynamic from 'next/dynamic'

// Pulls in wavesurfer.js and the full player UI — deferred so that code isn't
// part of every route's initial bundle (incl. pages where nothing is playing
// yet, like /login). It's invisible until a track is queued anyway
// (`hasTrack` gates its visibility), so mounting a beat after hydration is
// not observable. `ssr: false` requires a Client Component boundary, which is
// why this thin wrapper exists separately from the (Server Component) root layout.
export const GlobalPlayer = dynamic(
  () => import('@/components/player/global-player').then((m) => m.GlobalPlayer),
  { ssr: false },
)
