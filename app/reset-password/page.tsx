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

function ResetPasswordInner() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }
    if (password !== confirm) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword({ token, newPassword: password })
      toast.success('Passwort geändert. Du kannst dich jetzt anmelden.')
      router.push('/login')
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Zurücksetzen fehlgeschlagen.',
      )
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthShell
        title="Ungültiger Link"
        subtitle="Dieser Link zum Zurücksetzen ist unvollständig oder abgelaufen."
        footer={
          <Link href="/forgot-password" className="text-primary hover:underline">
            Neuen Link anfordern
          </Link>
        }
      >
        <Button render={<Link href="/forgot-password" />} size="lg" className="h-10 w-full">
          Neuen Link anfordern
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Neues Passwort"
      subtitle="Wähle ein neues Passwort für dein Konto."
      footer={
        <Link href="/login" className="text-primary hover:underline">
          Zurück zur Anmeldung
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Neues Passwort</Label>
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm">Passwort bestätigen</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          Passwort ändern
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
