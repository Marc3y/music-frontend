'use client'

import { RequireAuth } from '@/components/app/require-auth'
import { AppNav } from '@/components/app/app-nav'
import { AuroraBackground } from '@/components/aurora-background'
import { Reveal } from '@/components/reveal'
import { AppearanceSection } from '@/components/app/settings/appearance-section'
import { ProfileSection } from '@/components/app/settings/profile-section'
import { PasswordSection } from '@/components/app/settings/password-section'
import { DeleteAccountSection } from '@/components/app/settings/delete-account-section'

export default function SettingsPage() {
  return (
    <RequireAuth>
      <div className="relative min-h-dvh pb-32">
        <AuroraBackground variant="page" />

        <div className="relative">
          <AppNav />

          <main className="mx-auto max-w-2xl px-4 pt-4 sm:px-6">
            <div className="pb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-balance">
                Account-Einstellungen
              </h1>
              <p className="mt-1 text-muted-foreground">
                Verwalte dein Profil, dein Passwort und deinen Account.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Reveal>
                <AppearanceSection />
              </Reveal>
              <Reveal delayIndex={1}>
                <ProfileSection />
              </Reveal>
              <Reveal delayIndex={2}>
                <PasswordSection />
              </Reveal>
              <Reveal delayIndex={3}>
                <DeleteAccountSection />
              </Reveal>
            </div>
          </main>
        </div>
      </div>
    </RequireAuth>
  )
}
