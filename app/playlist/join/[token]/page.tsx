'use client'

import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/logo'
import { AuroraBackground } from '@/components/aurora-background'
import { useAuth } from '@/lib/auth-context'
import { playlistApi, ApiError } from '@/lib/api'

export default function JoinPlaylistPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const router = useRouter()
  const { user, loading } = useAuth()
  const ran = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading || ran.current) return
    ran.current = true

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/playlist/join/${token}`)}`)
      return
    }

    playlistApi
      .join(token)
      .then((res) => {
        toast.success('Playlist zu deiner Mediathek hinzugefügt')
        router.replace(`/library/${res.playlistId}`)
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Einladung konnte nicht angenommen werden.',
        )
      })
  }, [loading, user, token, router])

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-16">
      <AuroraBackground variant="auth" />
      <Link href="/" className="relative mb-8">
        <Logo className="[&_span]:text-xl" />
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative w-full max-w-sm rounded-3xl p-7 text-center shadow-(--elevate-3)"
      >
        {error ? (
          <>
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted">
              <Users className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{error}</p>
            <Link
              href="/library"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
            >
              Zur Mediathek
            </Link>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Einladung wird angenommen…</p>
          </div>
        )}
      </motion.div>
    </main>
  )
}
