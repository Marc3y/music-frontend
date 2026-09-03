import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative inline-flex size-7 items-center justify-center rounded-[0.7rem] bg-gradient-to-br from-primary to-accent shadow-[0_4px_14px_-4px_var(--primary)]">
        <span className="flex items-end gap-[2px]" aria-hidden>
          <span className="h-2 w-[2px] rounded-full bg-primary-foreground" />
          <span className="h-3.5 w-[2px] rounded-full bg-primary-foreground" />
          <span className="h-2.5 w-[2px] rounded-full bg-primary-foreground" />
        </span>
      </span>
      <span className="text-lg font-semibold lowercase tracking-tight">music</span>
    </span>
  )
}
