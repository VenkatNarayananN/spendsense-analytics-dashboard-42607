/**
 * Supabase client singleton for the SpendSense frontend.
 *
 * Usage:
 *   import { supabase, isSupabaseConfigured, isSupabaseConfiguredFn, getSupabase, getSupabaseDiagnostics } from '../lib/supabaseClient';
 *
 * Notes:
 * - This module is intentionally "safe" for demo mode: if env vars are missing,
 *   we do NOT throw at import time; we expose `supabase = null` instead.
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Env wiring:
 * - CRA exposes only REACT_APP_* at build time (values are inlined into the bundle).
 * - The primary supported env vars for this repo are:
 *   - REACT_APP_SUPABASE_URL
 *   - REACT_APP_SUPABASE_KEY
 * - We also support common fallback names to reduce misconfig friction in other environments.
 *
 * Supabase integration point:
 * This is the single place where the frontend decides whether Supabase is "configured".
 * Call-sites should use `isSupabaseConfigured` / `isSupabaseConfiguredFn()` and then use
 * `getSupabase()` or the `getAuthedClient()` helper.
 */
/** @type {string | undefined} */
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;

/** @type {string | undefined} */
const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

/**
 * Whether Supabase is configured via environment variables.
 * @type {boolean}
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * PUBLIC_INTERFACE
 * Returns a safe snapshot of the current Supabase env wiring for debugging UI.
 *
 * IMPORTANT: This intentionally does NOT return full keys; only the last 6 chars.
 *
 * @returns {{configured:boolean,urlPresent:boolean,keyPresent:boolean,urlValue:string,keySuffix:string}}
 */
export function getSupabaseDiagnostics() {
  const urlPresent = Boolean(supabaseUrl);
  const keyPresent = Boolean(supabaseAnonKey);

  /** @type {string} */
  const urlValue = supabaseUrl || "";
  /** @type {string} */
  const keySuffix = supabaseAnonKey ? String(supabaseAnonKey).slice(-6) : "";

  return {
    configured: Boolean(urlPresent && keyPresent),
    urlPresent,
    keyPresent,
    urlValue,
    keySuffix,
  };
}

/**
 * PUBLIC_INTERFACE
 * Helper function to check whether Supabase is configured.
 *
 * Kept as a function for call-sites that prefer an explicit check (and for parity with
 * other runtime-configured services), while still exporting the boolean constant above.
 *
 * @returns {boolean} True when both REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY are present.
 */
export function isSupabaseConfiguredFn() {
  return isSupabaseConfigured;
}

// In development, log a concise warning if missing, but keep the app running for demo mode.
if (!isSupabaseConfigured && process.env.NODE_ENV === "development") {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] Not configured: set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY to enable Supabase features."
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
