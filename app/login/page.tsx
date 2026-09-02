'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { ApiError } from '@/lib/api'

function LoginInner() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next')
  const dest = next && next.startsWith('/') ? next : '/library'
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      router.push(dest)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`)
        return
      }
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen')
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Willkommen zurück"
      subtitle="Melde dich an, um auf deine Mediathek zuzugreifen."
      footer={
        <>
          Noch kein Konto?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Registrieren
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="du@beispiel.de"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Passwort</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Vergessen?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-2 h-10" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Anmelden
        </Button>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}
