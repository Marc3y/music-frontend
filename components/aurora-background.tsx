'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'page' | 'auth' | 'minimal'

export const AuroraBackground = memo(function AuroraBackground({
  variant = 'page',
  className,
}: {
  variant?: Variant
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 isolate overflow-hidden',
        className,
      )}
    >
      <div
        className="absolute inset-0 text-foreground"
        style={{
          backgroundImage: 'var(--aurora-pattern)',
          backgroundSize: 'var(--aurora-pattern-size)',
          backgroundPosition: 'var(--aurora-pattern-position)',
          opacity: 'var(--aurora-pattern-opacity)',
          maskImage: 'linear-gradient(to bottom, #000, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000, transparent 85%)',
        }}
      />
      {variant !== 'minimal' && (
        <>
          <div
            className="absolute inset-x-0 top-0 h-[44rem]"
            style={{
              background:
                variant === 'auth'
                  ? 'radial-gradient(60% 60% at 50% 0%, var(--glow-cool), transparent 100%)'
                  : 'radial-gradient(70% 100% at 50% 0%, var(--glow-cool), transparent 100%)',
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-[36rem]"
            style={{
              background: 'radial-gradient(60% 100% at 100% 100%, var(--glow-warm), transparent 100%)',
            }}
          />
        </>
      )}
    </div>
  )
})
