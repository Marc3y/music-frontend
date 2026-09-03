'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsCard } from '@/components/app/settings/settings-card'
import { useAuth } from '@/lib/auth-context'
import { useT } from '@/lib/i18n/context'
import { accountApi, ApiError } from '@/lib/api'

export function PasswordSection() {
  const router = useRouter()
  const { user, setUser } = useAuth()
  const t = useT()

  const [step, setStep] = useState<'form' | 'code'>('form')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRequest(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 8) {
      setError(t('settings.newPasswordMin8'))
      return
    }
    if (newPassword !== repeatPassword) {
      setError(t('settings.passwordsMismatch'))
      return
    }
    setLoading(true)
    try {
      await accountApi.requestPasswordChange({ currentPassword, newPassword })
      toast.success(t('toast.verificationCodeSent'))
      setStep('code')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('settings.requestFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await accountApi.confirmPasswordChange(code)
      // Session wurde serverseitig beendet.
      setUser(null)
      toast.success(t('toast.passwordChangedRelogin'))
      router.push('/login')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('settings.confirmFailed'))
      setLoading(false)
    }
  }

  if (user && user.hasPassword === false) {
    return (
      <SettingsCard title={t('settings.passwordTitle')}>
        <p className="text-sm text-muted-foreground">{t('settings.googlePasswordNote')}</p>
      </SettingsCard>
    )
  }

  return (
    <SettingsCard
      title={t('settings.passwordTitle')}
      description={t('settings.passwordDesc')}
    >
      {step === 'form' ? (
        <form onSubmit={handleRequest} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="current-password">{t('settings.currentPassword')}</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">{t('settings.newPassword')}</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="repeat-password">{t('settings.repeatNewPassword')}</Label>
            <Input
              id="repeat-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="self-start">
            {loading && <Loader2 className="size-4 animate-spin" />}
            {t('settings.requestCode')}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleConfirm} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password-code">{t('settings.confirmationCode')}</Label>
            <Input
              id="password-code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="text-center font-mono text-lg tracking-[0.5em]"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep('form')
                setCode('')
                setError(null)
              }}
              disabled={loading}
            >
              {t('common.back')}
            </Button>
            <Button type="submit" disabled={loading || code.length !== 6}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {t('settings.changePassword')}
            </Button>
          </div>
        </form>
      )}
    </SettingsCard>
  )
}
