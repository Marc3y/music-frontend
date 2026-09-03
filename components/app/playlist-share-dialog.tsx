'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { playlistApi, ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Playlist } from '@/lib/types'

function errMsg(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback
}

function CopyRow({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex gap-2">
      <Input readOnly value={url} className="h-8 text-xs" />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={async () => {
          await navigator.clipboard.writeText(url)
          setCopied(true)
          toast.success('Link kopiert')
          setTimeout(() => setCopied(false), 2000)
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  )
}

function UsernameChips({
  items,
  onAdd,
  onRemove,
  placeholder,
}: {
  items: { label: string; joined?: boolean }[]
  onAdd: (username: string) => void
  onRemove: (username: string) => void
  placeholder: string
}) {
  const [value, setValue] = useState('')
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={value}
          placeholder={placeholder}
          className="h-8 text-xs"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              const v = value.trim().toLowerCase()
              if (v.length >= 3) onAdd(v)
              setValue('')
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const v = value.trim().toLowerCase()
            if (v.length >= 3) onAdd(v)
            setValue('')
          }}
        >
          Hinzufügen
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((it) => (
            <span
              key={it.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs"
            >
              {it.joined !== undefined && (
                <span
                  className={
                    'size-1.5 rounded-full ' + (it.joined ? 'bg-emerald-500' : 'bg-muted-foreground/40')
                  }
                  title={it.joined ? 'Beigetreten' : 'Eingeladen'}
                />
              )}
              {it.label}
              <button
                onClick={() => onRemove(it.label)}
                aria-label={`${it.label} entfernen`}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function PlaylistShareDialog({
  playlist,
  open,
  onOpenChange,
  onUpdated,
}: {
  playlist: Playlist | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (playlist: Playlist) => void
}) {
  const [busy, setBusy] = useState(false)
  const [collabInput, setCollabInput] = useState<{ username: string; joined: boolean }[]>([])
  const [collabToken, setCollabToken] = useState<string | undefined>(undefined)

  useEffect(() => {
    setCollabInput(
      (playlist?.collaborators ?? []).map((c) => ({
        username: c.username,
        joined: !!c.userId,
      })),
    )
    setCollabToken(playlist?.collabToken)
  }, [playlist])

  if (!playlist) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    )
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  async function share(body: Parameters<typeof playlistApi.updateShare>[1]) {
    setBusy(true)
    try {
      onUpdated(await playlistApi.updateShare(playlist!._id, body))
    } catch (err) {
      toast.error(errMsg(err, 'Speichern fehlgeschlagen'))
    } finally {
      setBusy(false)
    }
  }

  async function saveCollaborators(usernames: string[]) {
    setBusy(true)
    try {
      const res = await playlistApi.setCollaborators(playlist!._id, usernames)
      setCollabToken(res.collabToken ?? undefined)
      setCollabInput(res.collaborators)
      onUpdated({
        ...playlist!,
        collabToken: res.collabToken ?? undefined,
        collaborators: res.collaborators.map((c) => ({
          username: c.username,
          userId: c.joined ? 'joined' : undefined,
        })),
      })
    } catch (err) {
      toast.error(errMsg(err, 'Speichern fehlgeschlagen'))
    } finally {
      setBusy(false)
    }
  }

  const allowed = playlist.allowedUsernames ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Playlist teilen</DialogTitle>
          <DialogDescription>„{playlist.name}" teilen oder gemeinsam bearbeiten.</DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[65vh] flex-col gap-5 overflow-x-hidden overflow-y-auto scrollbar-gutter-stable">
          {/* Öffentlich teilen */}
          <section className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={!!playlist.shareEnabled}
                disabled={busy}
                onChange={(e) => share({ shareEnabled: e.target.checked })}
                className="size-4 accent-primary"
              />
              Playlist teilen
            </label>

            {playlist.shareEnabled && (
              <div className="flex flex-col gap-3 pl-6">
                <CopyRow url={`${origin}/playlist/${playlist.shareToken}`} />

                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={!!playlist.shareAllowDownload}
                    disabled={busy}
                    onChange={(e) => share({ shareAllowDownload: e.target.checked })}
                    className="size-4 accent-primary"
                  />
                  Projekt-Downloads erlauben
                </label>

                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={!!playlist.shareRestricted}
                    disabled={busy}
                    onChange={(e) => share({ shareRestricted: e.target.checked })}
                    className="size-4 accent-primary"
                  />
                  Nur bestimmte Nutzer
                </label>

                {playlist.shareRestricted && (
                  <div className="pl-6">
                    <UsernameChips
                      placeholder="Username"
                      items={allowed.map((u) => ({ label: u }))}
                      onAdd={(u) =>
                        share({ allowedUsernames: [...new Set([...allowed, u])] })
                      }
                      onRemove={(u) =>
                        share({ allowedUsernames: allowed.filter((x) => x !== u) })
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Mitglieder */}
          <section className="flex flex-col gap-3 border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium">Mitglieder</p>
              <p className="text-xs text-muted-foreground">
                Mitglieder dürfen Tracks, Reihenfolge, Name und Cover ändern – nur du kannst
                die Playlist löschen und das Teilen verwalten.
              </p>
            </div>

            <UsernameChips
              placeholder="Username eines Mitglieds"
              items={collabInput.map((c) => ({ label: c.username, joined: c.joined }))}
              onAdd={(u) =>
                saveCollaborators([
                  ...new Set([...collabInput.map((c) => c.username), u]),
                ])
              }
              onRemove={(u) =>
                saveCollaborators(collabInput.map((c) => c.username).filter((x) => x !== u))
              }
            />

            {collabInput.length > 0 && collabToken && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">
                  Sende diesen Einladungslink an das jeweilige Mitglied:
                </p>
                <CopyRow url={`${origin}/playlist/join/${collabToken}`} />
              </div>
            )}
          </section>
        </div>

        <p
          className={cn(
            'flex h-4 items-center gap-2 text-xs text-muted-foreground transition-opacity duration-200',
            busy ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden={!busy}
        >
          {busy && <Loader2 className="size-3.5 animate-spin" />} Speichert…
        </p>
      </DialogContent>
    </Dialog>
  )
}
