'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { useT } from '@/lib/i18n/context'
import { authApi, ApiError } from '@/lib/api'
import { getSupabase } from '@/lib/supabase'

type Phase =
  | { kind: 'working' }
  | { kind: 'error'; message: string }
  | { kind: 'username'; accessToken: string }

function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const t = useT()
  const { setUser } = useAuth()

  const nextParam = params.get('next')
  const dest = nextParam && nextParam.startsWith('/') ? nextParam : '/library'

  const [phase, setPhase] = useState<Phase>({ kind: 'working' })
  const [username, setUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const done = useRef(false)

  useEffect(() => {
    const supabase = getSupabase()

    async function handleToken(accessToken: string) {
      if (done.current) return
      done.current = true
      // We only needed Supabase to broker Google — drop its session now.
      void supabase.auth.signOut()
      try {
        const res = await authApi.google({ accessToken })
        if ('user' in res) {
          setUser(res.user)
          router.replace(dest)
        } else {
          setPhase({ kind: 'username', accessToken })
        }
      } catch (err) {
        setPhase({
          kind: 'error',
          message: err instanceof ApiError ? err.message : t('auth.googleFailed'),
        })
      }
    }

    function fail() {
      if (done.current) return
      done.current = true
      setPhase({ kind: 'error', message: t('auth.googleFailed') })
    }

    if (params.get('error') || params.get('error_description')) {
      fail()
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) void handleToken(data.session.access_token)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) void handleToken(session.access_token)
    })

    const timer = setTimeout(fail, 10000)

    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function submitUsername(e: FormEvent) {
    e.preventDefault()
    if (phase.kind !== 'username') return
    setUsernameError(null)
    setSubmitting(true)
    try {
      const res = await authApi.googleComplete({
        accessToken: phase.accessToken,
        username: username.trim(),
      })
      setUser(res.user)
      router.replace(dest)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setUsernameError(t('auth.usernameTaken'))
      } else {
        setUsernameError(err instanceof ApiError ? err.message : t('auth.googleFailed'))
      }
      setSubmitting(false)
    }
  }

  if (phase.kind === 'working') {
    return (
      <AuthShell title={t('auth.googleSigningIn')}>
        <div className="flex justify-center py-4">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AuthShell>
    )
  }

  if (phase.kind === 'error') {
    return (
      <AuthShell
        title={t('auth.googleFailedTitle')}
        subtitle={phase.message}
        footer={
          <Link href="/login" className="text-primary hover:underline">
            {t('auth.backToSignIn')}
          </Link>
        }
      >
        <Button render={<Link href="/login" />} size="lg" className="w-full">
          {t('auth.backToSignIn')}
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('auth.chooseUsernameTitle')}
      subtitle={t('auth.chooseUsernameSubtitle')}
    >
      <form onSubmit={submitUsername} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="oauth-username">{t('auth.usernameLabel')}</Label>
          <Input
            id="oauth-username"
            autoFocus
            required
            minLength={3}
            maxLength={30}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('auth.usernamePlaceholder')}
          />
        </div>

        {usernameError && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {usernameError}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="mt-2 h-10"
          disabled={submitting || username.trim().length < 3}
        >
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {t('auth.finishSignup')}
        </Button>
      </form>
    </AuthShell>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  )
}
