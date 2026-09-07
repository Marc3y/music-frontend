import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/format'
import { spring } from '@/lib/motion'

export function UsageBar({
  used,
  limit,
  unlimited,
  className,
}: {
  used: number
  limit: number
  unlimited?: boolean
  className?: string
}) {
  const pct = !unlimited && limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  const over = !unlimited && limit > 0 && used >= limit
  const warn = !unlimited && pct >= 80

  const barColor = over
    ? 'bg-destructive'
    : warn
      ? 'bg-amber-500'
      : 'bg-gradient-to-r from-primary/80 to-primary'

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {unlimited ? formatBytes(used) : `${formatBytes(used)} / ${formatBytes(limit)}`}
        </span>
        <span className={over ? 'text-destructive' : warn ? 'text-amber-500' : undefined}>
          {unlimited ? '∞' : `${Math.round(pct)} %`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn(
            'h-full rounded-full',
            unlimited ? 'bg-gradient-to-r from-primary/80 to-accent' : barColor,
          )}
          initial={{ width: 0 }}
          animate={{ width: unlimited ? '100%' : `${Math.max(pct, 2)}%` }}
          transition={spring.gentle}
        />
      </div>
    </div>
  )
}
