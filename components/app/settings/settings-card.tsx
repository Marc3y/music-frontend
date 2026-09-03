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
      className={cn('glass rounded-2xl p-5 shadow-(--elevate-1)', className)}
    >
      <h2 className="text-base font-medium">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  )
}
