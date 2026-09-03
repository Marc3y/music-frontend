'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { Loader2, MailCheck } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api'
import { useT } from '@/lib/i18n/context'

export default function ForgotPasswordPage() {
  const t = useT()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.forgotPassword({ email })
    } catch {
      // Response is intentionally uniform; always show success state.
    } finally {
      setLoading(false)
      setSent(true)
    }
  }

  return (
    <AuthShell
      title={t('auth.forgotTitle')}
      subtitle={t('auth.forgotSubtitle')}
      footer={
        <Link href="/login" className="text-primary hover:underline">
          {t('auth.backToSignIn')}
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-primary/12 text-primary">
            <MailCheck className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground text-pretty">
            {t('auth.forgotSent')}
          </p>
        </div>
      ) : (
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
          <Button type="submit" size="lg" className="mt-2 h-10" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {t('auth.forgotSubmit')}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
