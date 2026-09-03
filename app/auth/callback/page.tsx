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
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const supabase = getSupabase()
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const oauthError =
      url.searchParams.get('error_description') || url.searchParams.get('error')

    function fail(message?: string) {
      setPhase({ kind: 'error', message: message || t('auth.googleFailed') })
    }

    if (oauthError) {
      fail(oauthError)
      return
    }
    if (!code) {
      fail()
      return
    }

    ;(async () => {
      let accessToken: string
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error || !data.session?.access_token) {
          throw error ?? new Error('no session')
        }
        accessToken = data.session.access_token
      } catch {
        fail()
        return
      }

      try {
        const res = await authApi.google({ accessToken })
        if ('user' in res) {
          void supabase.auth.signOut({ scope: 'local' })
          setUser(res.user)
          router.replace(dest)
        } else {
          // Keep the Supabase session alive — googleComplete needs the token too.
          setPhase({ kind: 'username', accessToken })
        }
      } catch (err) {
        fail(err instanceof ApiError ? err.message : undefined)
      }
    })()
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
      void getSupabase().auth.signOut({ scope: 'local' })
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
