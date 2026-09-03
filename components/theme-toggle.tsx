'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { ease } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle, mounted } = useTheme()
  const isDark = theme === 'dark'

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      aria-label={isDark ? 'Zu hellem Modus wechseln' : 'Zu dunklem Modus wechseln'}
      className={cn(
        'relative flex size-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={mounted ? theme : 'ssr'}
          initial={{ y: 12, opacity: 0, rotate: -35 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -12, opacity: 0, rotate: 35 }}
          transition={{ duration: 0.28, ease: ease.out }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isDark ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
