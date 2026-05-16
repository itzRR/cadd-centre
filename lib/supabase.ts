import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'

/**
 * Browser-side Supabase client.
 * Uses @supabase/ssr's createBrowserClient so the session is stored
 * in cookies (not just localStorage) - this makes it readable by the
 * middleware and server components.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
