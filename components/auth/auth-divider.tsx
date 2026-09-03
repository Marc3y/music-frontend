'use client'

import { useT } from '@/lib/i18n/context'

export function AuthDivider() {
  const t = useT()
  return (
    <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {t('auth.orDivider')}
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
