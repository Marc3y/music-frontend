'use client'

import { useState, type FormEvent } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { playlistApi, ApiError } from '@/lib/api'
import type { Playlist } from '@/lib/types'

export function CreatePlaylistDialog({
  onCreated,
}: {
  onCreated: (playlist: Playlist) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    setLoading(true)
    try {
      const playlist = await playlistApi.create(name.trim())
      toast.success('Playlist erstellt')
      onCreated(playlist)
      setOpen(false)
      setName('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erstellen fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setError(null)
          setName('')
        }
      }}
    >
      <DialogTrigger render={<Button size="lg" />}>
        <Plus className="size-4" />
        Neue Playlist
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Playlist</DialogTitle>
          <DialogDescription>
            Gib deiner Playlist einen Namen. Das Cover kannst du danach hinzufügen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="playlist-name">Name</Label>
            <Input
              id="playlist-name"
              autoFocus
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mein Sommer-Mix"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
