'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi, ApiError } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }
    if (username.length < 3 || username.length > 30) {
      setError('Der Benutzername muss zwischen 3 und 30 Zeichen lang sein.')
      return
    }
    setLoading(true)
    try {
      await authApi.register({ email, username, password })
      toast.success('Registrierung erfolgreich. Bitte bestätige deine E-Mail.')
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Registrierung fehlgeschlagen. Bitte erneut versuchen.',
      )
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Konto erstellen"
      subtitle="Erstelle dein music-Konto und lade deinen ersten Track hoch."
      footer={
        <>
          Schon registriert?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Anmelden
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
          <Label htmlFor="username">Benutzername</Label>
          <Input
            id="username"
            autoComplete="username"
            required
            minLength={3}
            maxLength={30}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="dein_name"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Passwort</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mindestens 8 Zeichen"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-2 h-10" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Registrieren
        </Button>
      </form>
    </AuthShell>
  )
}
