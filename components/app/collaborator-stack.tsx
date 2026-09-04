'use client'

import { Avatar } from '@base-ui/react/avatar'
import { User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useT } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import type { UserBrief } from '@/lib/types'

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
}: {
  owner?: UserBrief | null
  collaborators: UserBrief[]
  showOwner?: boolean
}) {
  const t = useT()
  const max = 4
  const shown = collaborators.slice(0, max)
  const rest = collaborators.length - shown.length

  if (!collaborators.length && !(showOwner && owner)) return null

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
          <DropdownMenuContent align="start" className="min-w-52">
            <DropdownMenuLabel>{t('playlistPage.members')}</DropdownMenuLabel>
            {collaborators.map((u) => (
              <div
                key={u.username}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
              >
                <Circle user={u} className="ring-0" />
                <span className="truncate">@{u.username}</span>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
