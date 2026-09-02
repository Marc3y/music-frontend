'use client'

import { useState } from 'react'
import { Check, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { accountApi, ApiError } from '@/lib/api'

export function AddToLibraryButton({
  token,
  type,
}: {
  token: string
  type: 'audio' | 'project'
}) {
  const { user, loading } = useAuth()
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')

  if (loading || !user) return null

  async function add() {
    setState('busy')
    try {
      await accountApi.addSavedShare({ token, type })
      setState('done')
      toast.success('Zu deiner Mediathek hinzugefügt')
    } catch (err) {
      setState('idle')
      toast.error(err instanceof ApiError ? err.message : 'Hinzufügen fehlgeschlagen')
    }
  }

  return (
    <button
      onClick={add}
      disabled={state !== 'idle'}
      className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium transition-colors hover:bg-muted disabled:opacity-70"
    >
      {state === 'busy' ? (
        <Loader2 className="size-4 animate-spin" />
      ) : state === 'done' ? (
        <Check className="size-4" />
      ) : (
        <Plus className="size-4" />
      )}
      {state === 'done' ? 'In deiner Mediathek' : 'Zur Mediathek hinzufügen'}
    </button>
  )
}
