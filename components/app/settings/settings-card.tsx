import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function SettingsCard({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-xl',
        className,
      )}
    >
      <h2 className="text-base font-medium">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  )
}
