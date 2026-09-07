import type { Tier } from '@/lib/types'

export const TIER_RANK: Record<Tier, number> = { free: 0, plus: 1, unlimited: 2 }

export function hasPlus(tier: Tier | undefined | null): boolean {
  return (tier ? TIER_RANK[tier] : 0) >= 1
}

export function tierAtLeast(tier: Tier | undefined | null, min: Tier): boolean {
  return (tier ? TIER_RANK[tier] : 0) >= TIER_RANK[min]
}

export interface PlanInfo {
  id: Tier
  /** i18n key for the display name */
  nameKey: string
  monthly: number
  yearly: number
  /** i18n keys for the feature bullet list */
  featureKeys: string[]
  /** lucide icon name used for the badge (rendered by tier-badge) */
  accent: string
}

export const PLANS: PlanInfo[] = [
  {
    id: 'free',
    nameKey: 'subscription.planFree',
    monthly: 0,
    yearly: 0,
    featureKeys: [
      'subscription.featFreeStorage',
      'subscription.featPublicShare',
      'subscription.featVersions',
    ],
    accent: 'none',
  },
  {
    id: 'plus',
    nameKey: 'subscription.planPlus',
    monthly: 4.99,
    yearly: 49.99,
    featureKeys: [
      'subscription.featPlusStorage',
      'subscription.featCollab',
      'subscription.featListenNotifs',
      'subscription.featSharePassword',
    ],
    accent: 'sparkles',
  },
  {
    id: 'unlimited',
    nameKey: 'subscription.planUnlimited',
    monthly: 6.99,
    yearly: 69.99,
    featureKeys: [
      'subscription.featUnlimitedStorage',
      'subscription.featEverythingPlus',
    ],
    accent: 'crown',
  },
]

export function planFor(tier: Tier): PlanInfo {
  return PLANS.find((p) => p.id === tier) ?? PLANS[0]
}
