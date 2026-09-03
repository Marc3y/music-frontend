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

function VerifyEmailInner() {
  const router = useRouter()
  const params = useSearchParams()
  const t = useT()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authApi.verifyEmail({ email, code })
      toast.success(t('auth.verifySuccess'))
      router.push(`/login`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.verifyFailed'))
      setLoading(false)
    }
  }

  async function resend() {
    if (!email) {
      setError(t('auth.verifyEnterEmailFirst'))
      return
    }
    setResending(true)
    try {
      await authApi.resendVerification({ email })
      toast.success(t('auth.verifyResendSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('auth.verifyResendFailed'))
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title={t('auth.verifyTitle')}
      subtitle={t('auth.verifySubtitle')}
      footer={
        <Link href="/login" className="text-primary hover:underline">
          {t('auth.backToSignIn')}
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t('auth.emailLabel')}</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.emailPlaceholder')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="code">{t('auth.verifyCodeLabel')}</Label>
          <Input
            id="code"
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

        <Button type="submit" size="lg" className="mt-2 h-10" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {t('auth.verifySubmit')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={resend}
          disabled={resending}
          className="h-9"
        >
          {resending && <Loader2 className="size-4 animate-spin" />}
          {t('auth.verifyResend')}
        </Button>
      </form>
    </AuthShell>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  )
}
