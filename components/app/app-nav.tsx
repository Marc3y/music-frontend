'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'
import { Check, ChevronDown, Globe, HardDrive, ListMusic, LogOut, Settings, User } from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
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
import { ease } from '@/lib/motion'
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
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: ease.out }}
      className="sticky top-0 z-40"
    >
      <div
        className={cn(
          'mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 transition-[padding] duration-300 ease-apple sm:px-4',
          scrolled ? 'py-2.5' : 'py-4',
        )}
      >
        <Link
          href="/library"
          className={cn(
            'glass rounded-full px-4 py-2 transition-shadow duration-300',
            scrolled && 'shadow-(--elevate-2)',
          )}
        >
          <Logo />
        </Link>

        <div
          className={cn(
            'glass flex items-center gap-1 rounded-full p-1 pl-2 transition-shadow duration-300',
            scrolled && 'shadow-(--elevate-2)',
          )}
        >
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger className="group/trig flex cursor-pointer items-center gap-2 rounded-full py-1.5 pr-2.5 pl-1.5 outline-none transition-colors hover:bg-muted/60">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="size-6 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                  <User className="size-3.5 text-primary-foreground" />
                </span>
              )}
              <span className="max-w-[9rem] truncate text-sm font-medium">
                {user?.username}
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-200 ease-apple group-data-[popup-open]/trig:rotate-180" />
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
    </motion.header>
  )
}
