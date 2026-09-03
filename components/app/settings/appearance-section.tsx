'use client'

import { motion } from 'motion/react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { SettingsCard } from '@/components/app/settings/settings-card'
import { useTheme } from '@/lib/theme-context'
import { useT } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

const options = [
  { value: 'light' as const, labelKey: 'settings.themeLight', icon: Sun },
  { value: 'dark' as const, labelKey: 'settings.themeDark', icon: Moon },
]

export function AppearanceSection() {
  const { theme, setTheme, mounted } = useTheme()
  const t = useT()

  return (
    <SettingsCard
      title={t('settings.appearanceTitle')}
      description={t('settings.appearanceDesc')}
    >
      <div className="flex gap-2">
        {options.map((opt) => {
          const active = mounted && theme === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                'relative flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ease-apple',
                active
                  ? 'border-primary/40 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId="appearance-active"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 -z-10 rounded-xl bg-primary/10"
                />
              )}
              <opt.icon className="size-4" />
              {t(opt.labelKey)}
            </button>
          )
        })}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Monitor className="size-3.5" />
        {t('settings.themeDefaultHint')}
      </p>
    </SettingsCard>
  )
}
