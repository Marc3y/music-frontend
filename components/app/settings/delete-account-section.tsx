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
import { accountApi, ApiError } from '@/lib/api'

export function DeleteAccountSection() {
  const router = useRouter()
  const { setUser } = useAuth()

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
      toast.success('Bestätigungscode per E-Mail gesendet')
      setStep('code')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Anfrage fehlgeschlagen')
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
      toast.success('Dein Account wurde gelöscht.')
      router.replace('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Löschung fehlgeschlagen')
      setLoading(false)
    }
  }

  return (
    <SettingsCard
      title="Account löschen"
      description="Löscht deinen Account und alle deine Playlists, Tracks und Bilder unwiderruflich."
      className="border-destructive/40"
    >
      <Button
        variant="destructive"
        onClick={() => {
          reset()
          setOpen(true)
        }}
      >
        Account löschen
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
                <DialogTitle>Account wirklich löschen?</DialogTitle>
                <DialogDescription>
                  Diese Aktion ist endgültig. Alle deine Playlists, hochgeladenen Tracks
                  und Bilder werden vom Server gelöscht. Gib zur Bestätigung dein Passwort
                  ein – wir senden dir dann einen Code per E-Mail.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-2">
                <Label htmlFor="delete-password">Passwort</Label>
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
                  Abbrechen
                </Button>
                <Button type="submit" variant="destructive" disabled={loading || !password}>
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Bestätigungscode anfordern
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>Löschung bestätigen</DialogTitle>
                <DialogDescription>
                  Gib den Code aus der E-Mail ein, um deinen Account endgültig zu löschen.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-2">
                <Label htmlFor="delete-code">Bestätigungscode</Label>
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
                  Zurück
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={loading || code.length !== 6}
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Account endgültig löschen
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </SettingsCard>
  )
}
