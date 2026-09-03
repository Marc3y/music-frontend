'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const googleOAuthConfigured = Boolean(URL && ANON_KEY)

let client: SupabaseClient | null = null

/**
 * Supabase is only used as a Google OAuth broker. We don't keep its session
 * around — once the backend has issued our own cookie we sign out of Supabase.
 */
export function getSupabase(): SupabaseClient {
  if (!URL || !ANON_KEY) throw new Error('Supabase env not configured')
  if (!client) {
    client = createClient(URL, ANON_KEY, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: false,
      },
    })
  }
  return client
}
