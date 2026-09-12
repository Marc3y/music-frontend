'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * `next/image` for real remote URLs; a plain `<img>` for `blob:`/`data:`
 * URLs — several cover/avatar edit flows optimistically show a local preview
 * (`URL.createObjectURL`) before the server URL is known. Next's built-in
 * optimizer fetches images server-side and can't reach a `blob:` URL (it
 * only exists in this browser tab's memory), so routing those through it
 * would just break the preview.
 */
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
