'use client'

import dynamic from 'next/dynamic'

export const GlobalPlayer = dynamic(
  () => import('@/components/player/global-player').then((m) => m.GlobalPlayer),
  { ssr: false },
)
