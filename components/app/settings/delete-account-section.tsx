'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsCard } from '@/components/app/settings/settings-card'
import { useAuth } from '@/lib/auth-context'
import { useT } from '@/lib/i18n/context'
import { accountApi, ApiError } from '@/lib/api'

export function DeleteAccountSection() {
  const router = useRouter()
  const { setUser } = useAuth()
  const t = useT()

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'confirm' | 'code'>('confirm')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function reset() {
    setStep('confirm')
    setPassword('')
    setCode('')
    setError(null)
    setLoading(false)
  }

  async function handleRequest(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await accountApi.requestDeletion(password)
      toast.success(t('toast.verificationCodeSent'))
      setStep('code')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('settings.requestFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await accountApi.confirmDeletion(code)
      setUser(null)
      toast.success(t('toast.accountDeleted'))
      router.replace('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('settings.deleteFailed'))
      setLoading(false)
    }
  }

  return (
    <SettingsCard
      title={t('settings.deleteTitle')}
      description={t('settings.deleteDesc')}
      className="border-destructive/40"
    >
      <Button
        variant="destructive"
        onClick={() => {
          reset()
          setOpen(true)
        }}
      >
        {t('settings.deleteButton')}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) reset()
        }}
      >
        <DialogContent className="sm:max-w-md">
          {step === 'confirm' ? (
            <form onSubmit={handleRequest} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>{t('settings.deleteConfirmTitle')}</DialogTitle>
                <DialogDescription>{t('settings.deleteConfirmBody')}</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-2">
                <Label htmlFor="delete-password">{t('auth.passwordLabel')}</Label>
                <Input
                  id="delete-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" variant="destructive" disabled={loading || !password}>
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  {t('settings.requestDeleteCode')}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>{t('settings.deleteCodeTitle')}</DialogTitle>
                <DialogDescription>{t('settings.deleteCodeBody')}</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-2">
                <Label htmlFor="delete-code">{t('settings.confirmationCode')}</Label>
                <Input
                  id="delete-code"
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('confirm')
                    setCode('')
                    setError(null)
                  }}
                  disabled={loading}
                >
                  {t('common.back')}
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={loading || code.length !== 6}
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  {t('settings.deletePermanently')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </SettingsCard>
  )
}
