'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Download, FileArchive, Loader2 } from 'lucide-react'
import { Logo } from '@/components/logo'
import { AuroraBackground } from '@/components/aurora-background'
import { AddToLibraryButton } from '@/components/app/add-to-library-button'
import { audioApi, ApiError } from '@/lib/api'

export default function ShareProjectPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const [data, setData] = useState<{ url: string; filename: string; trackTitle: string } | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    audioApi
      .publicProjectShare(token)
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? 'Dieser Link ist ungültig oder wurde deaktiviert.'
            : 'Projektdatei konnte nicht geladen werden.',
        ),
      )
  }, [token])

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-16">
      <AuroraBackground variant="auth" />

      <Link href="/" className="relative mb-8">
        <Logo className="[&_span]:text-xl" />
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass relative w-full max-w-sm rounded-3xl p-7 text-center shadow-(--elevate-3)"
      >
        {error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : !data ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="mx-auto flex size-28 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 glow-primary">
              <FileArchive className="size-10 text-foreground/50" />
            </div>
            <h1 className="mt-5 text-xl font-semibold text-balance">{data.trackTitle}</h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">{data.filename}</p>

            <a
              href={data.url}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Download className="size-4" />
              Projekt herunterladen
            </a>

            <AddToLibraryButton token={token} type="project" />
          </>
        )}
      </motion.div>

      <p className="relative mt-6 text-sm text-muted-foreground">
        Geteilt über <span className="font-medium text-foreground">music</span>
      </p>
    </main>
  )
}
