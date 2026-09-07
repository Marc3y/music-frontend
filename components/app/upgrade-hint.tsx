'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

/**
 * Quiet, non-nagging pointer to the subscription page, shown next to a feature
 * that needs music+. Two flavours: an inline chip and a soft banner.
 */
export function UpgradeHint({
  variant = 'chip',
  labelKey = 'subscription.needsPlus',
  className,
}: {
  variant?: 'chip' | 'banner'
  labelKey?: string
  className?: string
}) {
  const t = useT()

  if (variant === 'banner') {
    return (
      <Link
        href="/subscription"
        className={cn(
          'flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/[0.06] px-3 py-2.5 text-sm transition-colors hover:bg-primary/[0.1]',
          className,
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Sparkles className="size-3.5" />
        </span>
        <span className="flex-1 text-muted-foreground">{t(labelKey)}</span>
        <span className="shrink-0 text-xs font-medium text-primary">
          {t('subscription.viewPlans')}
        </span>
      </Link>
    )
  }

  return (
    <Link
      href="/subscription"
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15',
        className,
      )}
    >
      <Sparkles className="size-3" />
      {t('subscription.planPlus')}
    </Link>
  )
}
