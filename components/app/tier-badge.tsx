'use client'

import Link from 'next/link'
import { Crown, Sparkles } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import type { Tier } from '@/lib/types'

export function TierBadge({
  tier,
  className,
  asLink = true,
}: {
  tier: Tier | undefined
  className?: string
  asLink?: boolean
}) {
  const t = useT()
  if (!tier || tier === 'free') return null

  const isUnlimited = tier === 'unlimited'
  const Icon = isUnlimited ? Crown : Sparkles
  const label = isUnlimited ? t('subscription.planUnlimited') : t('subscription.planPlus')

  const inner = (
    <span
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex size-5 shrink-0 items-center justify-center rounded-full',
        isUnlimited
          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
          : 'bg-primary/12 text-primary',
        className,
      )}
    >
      <Icon className="size-3" />
    </span>
  )

  return asLink ? <Link href="/subscription">{inner}</Link> : inner
}
