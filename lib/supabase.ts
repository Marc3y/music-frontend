'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const googleOAuthConfigured = Boolean(URL && ANON_KEY)

let client: SupabaseClient | null = null

/**
 * Supabase is only used as a Google OAuth broker. The `/auth/callback` page
 * exchanges the code manually (detectSessionInUrl: false so it isn't also
 * auto-exchanged), hands the token to our backend, and only then clears the
 * Supabase session locally. `persistSession` must stay on so the PKCE
 * code_verifier survives the redirect.
 */
export function getSupabase(): SupabaseClient {
  if (!URL || !ANON_KEY) throw new Error('Supabase env not configured')
  if (!client) {
    client = createClient(URL, ANON_KEY, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: false,
      },
    })
  }
  return client
}
