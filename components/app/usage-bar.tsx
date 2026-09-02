import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/format'

export function UsageBar({
  used,
  limit,
  className,
}: {
  used: number
  limit: number
  className?: string
}) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  const over = limit > 0 && used >= limit
  const warn = pct >= 80

  const barColor = over
    ? 'bg-destructive'
    : warn
      ? 'bg-amber-500'
      : 'bg-primary'

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {formatBytes(used)} von {formatBytes(limit)}
        </span>
        <span className={over ? 'text-destructive' : warn ? 'text-amber-500' : undefined}>
          {Math.round(pct)} %
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  )
}
