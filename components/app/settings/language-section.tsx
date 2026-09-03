'use client'

import { motion } from 'motion/react'
import { Globe } from 'lucide-react'
import { SettingsCard } from '@/components/app/settings/settings-card'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

export function LanguageSection() {
  const { locale, setLocale, locales, mounted, t } = useI18n()

  return (
    <SettingsCard title={t('settings.languageTitle')} description={t('settings.languageDesc')}>
      <div className="flex flex-wrap gap-2">
        {locales.map((l) => {
          const active = mounted && locale === l.code
          return (
            <button
              key={l.code}
              onClick={() => setLocale(l.code)}
              className={cn(
                'relative flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ease-apple',
                active
                  ? 'border-primary/40 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId="language-active"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 -z-10 rounded-xl bg-primary/10"
                />
              )}
              {l.name}
            </button>
          )
        })}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Globe className="size-3.5" />
        {t('settings.languageDefaultHint')}
      </p>
    </SettingsCard>
  )
}
