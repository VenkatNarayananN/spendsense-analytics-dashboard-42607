/**
 * Supabase client singleton for the SpendSense frontend.
 *
 * Usage:
 *   import { supabase, isSupabaseConfigured, getSupabase } from '../lib/supabaseClient';
 *
 * Notes:
 * - This module is intentionally "safe" for demo mode: if env vars are missing,
 *   we do NOT throw at import time; we expose `supabase = null` instead.
 * - If '@supabase/supabase-js' is not installed, install it:
 *     npm i @supabase/supabase-js
 */

import { createClient } from '@supabase/supabase-js';

/** @type {string | undefined} */
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
/** @type {string | undefined} */
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_KEY;

/**
 * Whether Supabase is configured via environment variables.
 * @type {boolean}
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// In development, log a concise warning if missing, but keep the app running for demo mode.
if (!isSupabaseConfigured && process.env.NODE_ENV === 'development') {
  // Keep it short to avoid noisy console output.
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] Not configured: set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY to enable Supabase features.'
  );
}

/**
 * Singleton Supabase client instance.
 * Will be `null` when Supabase env vars are not configured (demo mode).
 *
 * @type {import('@supabase/supabase-js').SupabaseClient | null}
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * PUBLIC_INTERFACE
 * Returns the singleton Supabase client or null if not configured.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient | null} Supabase client when configured, otherwise null.
 */
export function getSupabase() {
  return supabase;
}
