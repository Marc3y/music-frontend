'use client'

import { useRef, useState, type FormEvent } from 'react'
import { Loader2, Trash2, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsCard } from '@/components/app/settings/settings-card'
import { AvatarCropDialog } from '@/components/app/settings/avatar-crop-dialog'
import { useAuth } from '@/lib/auth-context'
import { accountApi, ApiError } from '@/lib/api'

export function ProfileSection() {
  const { user, setUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [removingAvatar, setRemovingAvatar] = useState(false)

  const [username, setUsername] = useState(user?.username ?? '')
  const [savingUsername, setSavingUsername] = useState(false)

  async function refreshUser() {
    const fresh = await accountApi.me()
    setUser(fresh)
  }

  function handleFileSelect(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte eine Bilddatei auswählen')
      return
    }
    setPendingFile(file)
    setCropOpen(true)
  }

  async function handleRemoveAvatar() {
    setRemovingAvatar(true)
    try {
      await accountApi.deleteAvatar()
      await refreshUser()
      toast.success('Profilbild entfernt')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Entfernen fehlgeschlagen')
    } finally {
      setRemovingAvatar(false)
    }
  }

  async function handleUsernameSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = username.trim()
    if (!trimmed || trimmed === user?.username) return
    setSavingUsername(true)
    try {
      const fresh = await accountApi.updateUsername(trimmed)
      setUser(fresh)
      toast.success('Username geändert')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Speichern fehlgeschlagen')
    } finally {
      setSavingUsername(false)
    }
  }

  return (
    <SettingsCard title="Profil" description="Dein Profilbild und dein Anzeigename.">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative size-20 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary/25 to-accent/15"
        >
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center">
              <UserIcon className="size-7 text-foreground/40" />
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-background/60 text-xs opacity-0 transition-opacity group-hover:opacity-100">
            Ändern
          </span>
        </button>

        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            Bild ändern
          </Button>
          {user?.avatarUrl && (
            <Button
              variant="ghost"
              onClick={handleRemoveAvatar}
              disabled={removingAvatar}
              className="text-muted-foreground"
            >
              {removingAvatar ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Entfernen
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            handleFileSelect(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      <form onSubmit={handleUsernameSubmit} className="mt-6 flex flex-col gap-2">
        <Label htmlFor="settings-username">Username</Label>
        <div className="flex gap-2">
          <Input
            id="settings-username"
            value={username}
            minLength={3}
            maxLength={30}
            required
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button
            type="submit"
            disabled={
              savingUsername || !username.trim() || username.trim() === user?.username
            }
          >
            {savingUsername && <Loader2 className="size-4 animate-spin" />}
            Speichern
          </Button>
        </div>
      </form>

      <AvatarCropDialog
        file={pendingFile}
        open={cropOpen}
        onOpenChange={(next) => {
          setCropOpen(next)
          if (!next) setPendingFile(null)
        }}
        onUploaded={refreshUser}
      />
    </SettingsCard>
  )
}
