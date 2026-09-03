'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth/auth-shell'
import { GoogleButton } from '@/components/auth/google-button'
import { AuthDivider } from '@/components/auth/auth-divider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi, ApiError } from '@/lib/api'
import { useT } from '@/lib/i18n/context'

function RegisterInner() {
  const router = useRouter()
  const t = useT()
  const nextParam = useSearchParams().get('next')
  const next = nextParam && nextParam.startsWith('/') ? nextParam : undefined
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError(t('auth.passwordMin8'))
      return
    }
    if (username.length < 3 || username.length > 30) {
      setError(t('auth.usernameLength'))
      return
    }
    setLoading(true)
    try {
      await authApi.register({ email, username, password })
      toast.success(t('auth.registerSuccess'))
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.registerFailed'))
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <>
          {t('auth.registerHaveAccount')}{' '}
          <Link href="/login" className="text-primary hover:underline">
            {t('nav.signIn')}
          </Link>
        </>
      }
    >
      <GoogleButton next={next} />
      <AuthDivider />

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t('auth.emailLabel')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.emailPlaceholder')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="username">{t('auth.usernameLabel')}</Label>
          <Input
            id="username"
            autoComplete="username"
            required
            minLength={3}
            maxLength={30}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('auth.usernamePlaceholder')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
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

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-2 h-10" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {t('auth.registerSubmit')}
        </Button>
      </form>
    </AuthShell>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  )
}
