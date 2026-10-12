import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative inline-flex size-6 items-center justify-center rounded-[0.45rem] bg-foreground">
        <span className="flex items-center gap-[2px]" aria-hidden>
          <span className="h-1.5 w-[2px] rounded-full bg-background" />
          <span className="h-3 w-[2px] rounded-full bg-background" />
          <span className="h-2 w-[2px] rounded-full bg-background" />
          <span className="h-2.5 w-[2px] rounded-full bg-background" />
        </span>
      </span>
      <span className="text-[1.0625rem] font-semibold lowercase tracking-[-0.02em]">music</span>
    </span>
  )
}
