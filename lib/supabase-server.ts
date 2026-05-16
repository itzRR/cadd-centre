/**
 * lib/supabase-server.ts
 * Re-exports the server-side Supabase client factory.
 * Only import this from Server Actions / Server Components.
 */
export { createServerSupabaseClient as createServerClient } from './auth-server'
export { getServerCurrentUser as getServerUser } from './auth-server'
