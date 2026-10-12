'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'
import { BarChart3, Check, ChevronDown, CreditCard, Globe, HardDrive, ListMusic, LogOut, Settings, User } from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationBell } from '@/components/app/notification-bell'
import { CoverImage } from '@/components/ui/cover-image'
import { TierBadge } from '@/components/app/tier-badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

export function AppNav() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { t, locale, setLocale, locales } = useI18n()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 8))

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-[background-color,border-color] duration-300 ease-apple',
        scrolled ? 'material-bar border-border' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/library"
          className="-ml-1 rounded-lg px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Logo />
        </Link>

        <div className="flex items-center gap-0.5">
          <ThemeToggle />

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger className="group/trig ml-1 flex cursor-pointer items-center gap-2 rounded-full py-1 pr-2 pl-1 outline-none transition-colors duration-150 hover:bg-muted active:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 data-[popup-open]:bg-muted">
              {user?.avatarUrl ? (
                <span className="relative size-6 shrink-0 overflow-hidden rounded-full">
                  <CoverImage src={user.avatarUrl} alt="" sizes="24px" />
                </span>
              ) : (
                <span className="flex size-6 items-center justify-center rounded-full bg-foreground/10 text-[0.6875rem] font-semibold uppercase text-foreground">
                  {user?.username?.charAt(0) ?? <User className="size-3.5" />}
                </span>
              )}
              <span className="max-w-[5rem] truncate text-sm font-medium sm:max-w-[9rem]">
                {user?.username}
              </span>
              <TierBadge tier={user?.tier} asLink={false} className="ml-0.5" />
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ease-apple group-data-[popup-open]/trig:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/library')}>
                <ListMusic className="size-4" />
                {t('nav.library')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="size-4" />
                {t('nav.accountSettings')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/subscription')}>
                <CreditCard className="size-4" />
                {t('nav.subscription')}
                {user?.tier && user.tier !== 'free' && (
                  <span className="ml-auto text-xs font-medium text-primary">
                    {user.tier === 'unlimited'
                      ? t('subscription.tierUnlimitedShort')
                      : t('subscription.planPlus')}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/stats')}>
                <BarChart3 className="size-4" />
                {t('nav.stats')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/usage')}>
                <HardDrive className="size-4" />
                {t('nav.usage')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Globe className="size-4" />
                  {t('nav.language')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-44">
                  {locales.map((l) => (
                    <DropdownMenuItem
                      key={l.code}
                      onClick={() => setLocale(l.code)}
                      closeOnClick={false}
                    >
                      <Check
                        className={cn(
                          'size-4',
                          l.code === locale ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {l.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut className="size-4" />
                {t('nav.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
