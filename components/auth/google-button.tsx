'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n/context'
import { getSupabase, googleOAuthConfigured } from '@/lib/supabase'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1a6.2 6.2 0 0 1 0-12.4c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 2.7 14.6 1.8 12 1.8a10.2 10.2 0 0 0 0 20.4c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.2-.2-1.7H12z"
      />
      <path
        fill="#4285F4"
        d="M21.6 12.3c0-.7-.1-1.2-.2-1.7H12v3.5h5.4c-.1.8-.7 2.1-1.9 3l2.9 2.2c1.7-1.6 2.7-3.9 2.7-6.7z"
      />
      <path
        fill="#FBBC05"
        d="M5.8 14.3a6.2 6.2 0 0 1 0-4.6L2.9 7.4a10.2 10.2 0 0 0 0 9.2l2.9-2.3z"
      />
      <path
        fill="#34A853"
        d="M12 22.2c2.6 0 4.7-.9 6.3-2.3l-2.9-2.2c-.8.5-1.9.9-3.4.9-2.6 0-4.8-1.7-5.6-4.1l-2.9 2.3A10.2 10.2 0 0 0 12 22.2z"
      />
    </svg>
  )
}

export function GoogleButton({ next }: { next?: string }) {
  const t = useT()
  const [loading, setLoading] = useState(false)

  if (!googleOAuthConfigured) return null

  async function start() {
    setLoading(true)
    try {
      const redirectTo =
        `${window.location.origin}/auth/callback` +
        (next && next.startsWith('/') ? `?next=${encodeURIComponent(next)}` : '')
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })
      if (error) setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      disabled={loading}
      onClick={start}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
      {t('auth.continueWithGoogle')}
    </Button>
  )
}
