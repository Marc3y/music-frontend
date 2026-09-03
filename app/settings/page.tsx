'use client'

import { RequireAuth } from '@/components/app/require-auth'
import { AppNav } from '@/components/app/app-nav'
import { AuroraBackground } from '@/components/aurora-background'
import { Reveal } from '@/components/reveal'
import { AppearanceSection } from '@/components/app/settings/appearance-section'
import { LanguageSection } from '@/components/app/settings/language-section'
import { ProfileSection } from '@/components/app/settings/profile-section'
import { PasswordSection } from '@/components/app/settings/password-section'
import { DeleteAccountSection } from '@/components/app/settings/delete-account-section'
import { useT } from '@/lib/i18n/context'

export default function SettingsPage() {
  const t = useT()
  return (
    <RequireAuth>
      <div className="relative min-h-dvh pb-32">
        <AuroraBackground variant="page" />

        <div className="relative">
          <AppNav />

          <main className="mx-auto max-w-2xl px-4 pt-4 sm:px-6">
            <div className="pb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-balance">
                {t('settings.title')}
              </h1>
              <p className="mt-1 text-muted-foreground">{t('settings.subtitle')}</p>
            </div>

            <div className="flex flex-col gap-4">
              <Reveal>
                <AppearanceSection />
              </Reveal>
              <Reveal delayIndex={1}>
                <LanguageSection />
              </Reveal>
              <Reveal delayIndex={2}>
                <ProfileSection />
              </Reveal>
              <Reveal delayIndex={3}>
                <PasswordSection />
              </Reveal>
              <Reveal delayIndex={4}>
                <DeleteAccountSection />
              </Reveal>
            </div>
          </main>
        </div>
      </div>
    </RequireAuth>
  )
}
