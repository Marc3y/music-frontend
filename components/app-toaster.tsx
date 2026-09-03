'use client'

import { Toaster } from 'sonner'
import { useTheme } from '@/lib/theme-context'

export function AppToaster() {
  const { theme } = useTheme()

  return (
    <Toaster
      theme={theme}
      position="top-center"
      toastOptions={{
        style: {
          background: 'var(--popover)',
          border: '1px solid var(--border)',
          color: 'var(--popover-foreground)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--elevate-2)',
        },
      }}
    />
  )
}
