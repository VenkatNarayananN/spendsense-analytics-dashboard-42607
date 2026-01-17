import { getSupabase, isSupabaseConfiguredFn } from "./supabaseClient";

/**
 * PUBLIC_INTERFACE
 * Returns a Supabase client suitable for authenticated DB calls (RLS-compatible).
 *
 * Notes:
 * - When using supabase-js with persisted sessions, auth headers are attached automatically
 *   to PostgREST requests made via `supabase.from(...)`.
 * - This helper exists to centralize the "configured vs demo mode" check and provide a
 *   stable import for data utilities.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getAuthedClient() {
  if (!isSupabaseConfiguredFn()) return null;
  return getSupabase();
}

