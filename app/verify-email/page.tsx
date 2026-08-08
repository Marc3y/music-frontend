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

function VerifyEmailInner() {
  const router = useRouter()
  const params = useSearchParams()
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
      toast.success('E-Mail bestätigt. Du kannst dich jetzt anmelden.')
      router.push(`/login`)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Bestätigung fehlgeschlagen.',
      )
      setLoading(false)
    }
  }

  async function resend() {
    if (!email) {
      setError('Bitte gib zuerst deine E-Mail-Adresse ein.')
      return
    }
    setResending(true)
    try {
      await authApi.resendVerification({ email })
      toast.success('Falls die E-Mail existiert, wurde ein neuer Code gesendet.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Senden fehlgeschlagen.')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title="E-Mail bestätigen"
      subtitle="Gib den 6-stelligen Code ein, den wir dir per E-Mail gesendet haben."
      footer={
        <Link href="/login" className="text-primary hover:underline">
          Zurück zur Anmeldung
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="du@beispiel.de"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="code">Bestätigungscode</Label>
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
          Bestätigen
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={resend}
          disabled={resending}
          className="h-9"
        >
          {resending && <Loader2 className="size-4 animate-spin" />}
          Code erneut senden
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
