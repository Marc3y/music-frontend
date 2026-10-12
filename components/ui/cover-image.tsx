'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

export function CoverImage({
  src,
  alt,
  sizes,
  className,
  priority,
}: {
  src: string
  alt: string
  sizes: string
  className?: string
  priority?: boolean
}) {
  if (src.startsWith('blob:') || src.startsWith('data:')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={cn('size-full object-cover', className)} />
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
    />
  )
}
