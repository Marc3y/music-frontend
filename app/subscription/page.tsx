'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Check, Crown, Sparkles } from 'lucide-react'
import { RequireAuth } from '@/components/app/require-auth'
import { AppNav } from '@/components/app/app-nav'
import { AuroraBackground } from '@/components/aurora-background'
import { Reveal } from '@/components/reveal'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth-context'
import { useT } from '@/lib/i18n/context'
import { PLANS } from '@/lib/subscription'
import { ease } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { Tier } from '@/lib/types'

const PLAN_ICON: Record<string, typeof Sparkles | null> = {
  none: null,
  sparkles: Sparkles,
  crown: Crown,
}

export default function SubscriptionPage() {
  const t = useT()
  const { user } = useAuth()
  const [yearly, setYearly] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<Tier | null>(null)

  const currentTier: Tier = user?.tier ?? 'free'

  return (
    <RequireAuth>
      <div className="relative min-h-dvh pb-32">
        <AuroraBackground variant="page" />

        <div className="relative isolate">
          <AppNav />

          <main className="mx-auto max-w-5xl px-4 pt-4 sm:px-6">
            <Reveal className="pt-6 pb-8 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...{ type: 'spring', stiffness: 260, damping: 20 }, delay: 0.05 }}
                className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary"
              >
                <Sparkles className="size-6" />
              </motion.div>
              <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {t('subscription.title')}
              </h1>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                {t('subscription.subtitle')}
              </p>
            </Reveal>

            <Reveal delayIndex={1} className="mb-8 flex justify-center">
              <div className="flex items-center gap-1 rounded-full bg-muted/60 p-1 text-sm">
                {([false, true] as const).map((y) => (
                  <button
                    key={String(y)}
                    onClick={() => setYearly(y)}
                    className={cn(
                      'relative rounded-full px-4 py-1.5 font-medium transition-colors',
                      yearly === y
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {yearly === y && (
                      <motion.span
                        layoutId="billing-toggle"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        className="absolute inset-0 -z-10 rounded-full bg-background shadow-sm"
                      />
                    )}
                    {y ? t('subscription.yearly') : t('subscription.monthly')}
                    {y && (
                      <span className="ml-1.5 text-xs text-primary">
                        {t('subscription.yearlySave')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-3">
              {PLANS.map((plan, i) => {
                const Icon = PLAN_ICON[plan.accent]
                const isCurrent = currentTier === plan.id
                const price = yearly ? plan.yearly : plan.monthly
                const featured = plan.id === 'plus'

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 + i * 0.09, ease: ease.out }}
                    whileHover={{ y: -4 }}
                    className={cn(
                      'relative flex flex-col rounded-3xl border p-6 shadow-(--elevate-1)',
                      featured
                        ? 'border-primary/40 bg-card shadow-(--elevate-2)'
                        : 'border-border bg-card/60',
                    )}
                  >
                    {featured && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                        {t('subscription.popular')}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {Icon && (
                        <span
                          className={cn(
                            'flex size-8 items-center justify-center rounded-xl',
                            plan.id === 'unlimited'
                              ? 'bg-amber-500/15 text-amber-500'
                              : 'bg-primary/15 text-primary',
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                      )}
                      <h2 className="text-lg font-semibold">{t(plan.nameKey)}</h2>
                    </div>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-semibold tracking-tight">
                        {price === 0 ? t('subscription.free') : `€${price.toFixed(2)}`}
                      </span>
                      {price > 0 && (
                        <span className="text-sm text-muted-foreground">
                          /{yearly ? t('subscription.perYear') : t('subscription.perMonth')}
                        </span>
                      )}
                    </div>

                    <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm">
                      {plan.featureKeys.map((key) => (
                        <li key={key} className="flex items-start gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span className="text-muted-foreground">{t(key)}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      {isCurrent ? (
                        <Button variant="outline" disabled className="w-full">
                          {t('subscription.current')}
                        </Button>
                      ) : plan.id === 'free' ? (
                        <Button variant="ghost" disabled className="w-full text-muted-foreground">
                          {t('subscription.included')}
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          variant={featured ? 'default' : 'outline'}
                          onClick={() => setPendingPlan(plan.id)}
                        >
                          {t('subscription.choosePlan', { plan: t(plan.nameKey) })}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <Reveal delayIndex={4} className="mt-8 text-center text-xs text-muted-foreground">
              {t('subscription.devNote')}
            </Reveal>
          </main>
        </div>
      </div>

      <Dialog open={pendingPlan !== null} onOpenChange={(o) => !o && setPendingPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('subscription.comingSoonTitle')}</DialogTitle>
            <DialogDescription>{t('subscription.comingSoonBody')}</DialogDescription>
          </DialogHeader>
          <Button onClick={() => setPendingPlan(null)}>{t('common.close')}</Button>
        </DialogContent>
      </Dialog>
    </RequireAuth>
  )
}
