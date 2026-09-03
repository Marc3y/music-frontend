'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi, ApiError } from '@/lib/api'
import { useT } from '@/lib/i18n/context'

function ResetPasswordInner() {
  const router = useRouter()
  const params = useSearchParams()
  const t = useT()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError(t('auth.passwordMin8'))
      return
    }
    if (password !== confirm) {
      setError(t('auth.passwordsMismatch'))
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword({ token, newPassword: password })
      toast.success(t('auth.resetSuccess'))
      router.push('/login')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.resetFailed'))
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthShell
        title={t('auth.resetInvalidTitle')}
        subtitle={t('auth.resetInvalidSubtitle')}
        footer={
          <Link href="/forgot-password" className="text-primary hover:underline">
            {t('auth.resetRequestNew')}
          </Link>
        }
      >
        <Button render={<Link href="/forgot-password" />} size="lg" className="h-10 w-full">
          {t('auth.resetRequestNew')}
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('auth.resetTitle')}
      subtitle={t('auth.resetSubtitle')}
      footer={
        <Link href="/login" className="text-primary hover:underline">
          {t('auth.backToSignIn')}
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t('auth.newPasswordLabel')}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.passwordMinPlaceholder')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm">{t('auth.confirmPasswordLabel')}</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-2 h-10" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {t('auth.resetSubmit')}
        </Button>
      </form>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  )
}
