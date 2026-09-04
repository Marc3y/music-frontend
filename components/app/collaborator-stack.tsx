'use client'

import { useState } from 'react'
import { Avatar } from '@base-ui/react/avatar'
import { Loader2, User, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useT } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import type { UserBrief } from '@/lib/types'

const SKIP_CONFIRM_KEY = 'music.collab.skipRemoveConfirm'

function Circle({ user, className }: { user: UserBrief; className?: string }) {
  return (
    <Avatar.Root
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/30 to-accent/20 text-[10px] font-medium text-primary-foreground ring-2 ring-background select-none',
        className,
      )}
      title={user.username}
    >
      {user.avatarUrl ? (
        <Avatar.Image
          src={user.avatarUrl}
          alt=""
          className="size-full object-cover"
        />
      ) : null}
      <Avatar.Fallback className="flex size-full items-center justify-center uppercase">
        {user.username.slice(0, 1) || <User className="size-3.5" />}
      </Avatar.Fallback>
    </Avatar.Root>
  )
}

export function CollaboratorStack({
  owner,
  collaborators,
  showOwner,
  canRemove,
  onRemove,
}: {
  owner?: UserBrief | null
  collaborators: UserBrief[]
  showOwner?: boolean
  canRemove?: boolean
  onRemove?: (username: string) => Promise<void>
}) {
  const t = useT()
  const max = 4
  const shown = collaborators.slice(0, max)
  const rest = collaborators.length - shown.length

  const [removeTarget, setRemoveTarget] = useState<UserBrief | null>(null)
  const [dontAskAgain, setDontAskAgain] = useState(false)
  const [removing, setRemoving] = useState(false)

  if (!collaborators.length && !(showOwner && owner)) return null

  function skipConfirm() {
    try {
      return localStorage.getItem(SKIP_CONFIRM_KEY) === '1'
    } catch {
      return false
    }
  }

  async function runRemove(user: UserBrief) {
    if (!onRemove) return
    setRemoving(true)
    try {
      await onRemove(user.username)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('playlistShare.saveFailed'))
    } finally {
      setRemoving(false)
    }
  }

  function requestRemove(user: UserBrief) {
    if (skipConfirm()) {
      void runRemove(user)
    } else {
      setDontAskAgain(false)
      setRemoveTarget(user)
    }
  }

  function confirmRemove() {
    if (!removeTarget) return
    if (dontAskAgain) {
      try {
        localStorage.setItem(SKIP_CONFIRM_KEY, '1')
      } catch {
        /* ignore */
      }
    }
    const user = removeTarget
    setRemoveTarget(null)
    void runRemove(user)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {showOwner && owner && (
        <div className="flex items-center gap-1.5 rounded-full bg-muted/60 py-1 pr-2.5 pl-1">
          <Circle user={owner} className="ring-0" />
          <span className="text-xs text-muted-foreground">
            {t('playlistPage.owner')} <span className="text-foreground">@{owner.username}</span>
          </span>
        </div>
      )}

      {collaborators.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className="group/collab flex items-center gap-2 rounded-full outline-none">
            <div className="flex -space-x-2">
              {shown.map((u) => (
                <Circle key={u.username} user={u} />
              ))}
              {rest > 0 && (
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-background">
                  +{rest}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground group-hover/collab:text-foreground">
              {t('playlistPage.members')}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t('playlistPage.members')}</DropdownMenuLabel>
              {collaborators.map((u) => (
                <div
                  key={u.username}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
                >
                  <Circle user={u} className="ring-0" />
                  <span className="min-w-0 flex-1 truncate">@{u.username}</span>
                  {canRemove && onRemove && (
                    <button
                      type="button"
                      onClick={() => requestRemove(u)}
                      disabled={removing}
                      aria-label={t('playlistPage.removeMember', { username: u.username })}
                      className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                    >
                      {removing && removeTarget?.username === u.username ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <X className="size-3.5" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <AlertDialog open={removeTarget !== null} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('playlistPage.removeMemberTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget &&
                t('playlistPage.removeMemberBody', { username: removeTarget.username })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="size-4 accent-primary"
            />
            {t('playlistPage.dontAskAgain')}
          </label>

          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              onClick={(e) => {
                e.preventDefault()
                confirmRemove()
              }}
            >
              {t('common.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
