'use client'

import { Switch as SwitchPrimitive } from '@base-ui/react/switch'

import { cn } from '@/lib/utils'

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-[1.15rem] w-8 shrink-0 cursor-pointer items-center rounded-full border border-transparent p-0.5 outline-none transition-colors duration-200 ease-apple',
        'bg-input data-checked:bg-primary',
        'focus-visible:ring-[3px] focus-visible:ring-primary/25',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-3.5 rounded-full bg-background shadow-sm transition-transform duration-200 ease-apple data-checked:translate-x-[0.85rem]" />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
