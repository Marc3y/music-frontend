'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle, mounted } = useTheme()
  const isDark = theme === 'dark'

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.92 }}
      aria-label={isDark ? 'Zu hellem Modus wechseln' : 'Zu dunklem Modus wechseln'}
      className={cn(
        'relative flex size-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40',
        className,
      )}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={mounted ? theme : 'ssr'}
          initial={{ opacity: 0, scale: 0.6, rotate: -45 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.6, rotate: 45 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isDark ? <Moon className="size-[17px]" /> : <Sun className="size-[17px]" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
