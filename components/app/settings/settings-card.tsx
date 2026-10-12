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
      className={cn('rounded-2xl border border-border bg-card p-5', className)}
    >
      <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em]">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  )
}
