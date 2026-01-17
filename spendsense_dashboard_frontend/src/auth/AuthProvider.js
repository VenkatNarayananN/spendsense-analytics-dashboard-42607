import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSupabase, isSupabaseConfiguredFn } from "../lib/supabaseClient";

/**
 * Auth provider backed by Supabase.
 *
 * Supabase integration points:
 * - Reads the Supabase client from `src/lib/supabaseClient.js`.
 * - Uses `supabase.auth.getSession()` to resolve the initial session.
 * - Uses `supabase.auth.onAuthStateChange(...)` to keep React state in sync with:
 *   login/logout/token refresh.
 *
 * Demo-mode behavior:
 * - If Supabase env vars are missing, the app remains navigable (no hard crash).
 * - Auth methods become safe no-ops that warn instead of throwing.
 *
 * Operational note:
 * If sign-in appears "disabled", check the `/login` diagnostics panel which reads from
 * `getSupabaseDiagnostics()` and confirms that the frontend bundle has the expected env vars.
 */

const AuthContext = createContext(null);

function warnSupabaseNotConfigured(methodName) {
  // Keep warnings concise and non-fatal; avoid throwing to preserve demo mode.
  // eslint-disable-next-line no-console
  console.warn(
    `[auth] ${methodName} called, but Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY to enable auth.`
  );
}

/**
 * PUBLIC_INTERFACE
 * Auth provider for the application.
 *
 * Provides:
 * { session, user, isAuthenticated, loading, login, logout, signInWithOtp, signInWithOAuth, getAccessToken }
 */
export function AuthProvider({ children }) {
  const supabase = getSupabase();
  const supabaseConfigured = isSupabaseConfiguredFn();

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  // loading indicates whether we've resolved the initial auth state.
  // Never keep an infinite loader in demo mode.
  const [loading, setLoading] = useState(Boolean(supabaseConfigured));

  useEffect(() => {
    let isMounted = true;

    // Demo mode: resolve immediately; no subscription needed.
    if (!supabaseConfigured || !supabase) {
      setSession(null);
      setUser(null);
      setLoading(false);
      return () => {};
    }

    // Initial session fetch
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (error) {
          // eslint-disable-next-line no-console
          console.warn("[auth] Failed to get session:", error.message);
        }
        const nextSession = data?.session ?? null;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    // Keep auth state in sync (login/logout/token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      // After initial resolution, ensure we never regress to an infinite loader.
      setLoading(false);
    });

    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [supabase, supabaseConfigured]);

  const isAuthenticated = Boolean(session?.user);

  const login = useCallback(
    async (email, password) => {
      if (!supabaseConfigured || !supabase) {
        warnSupabaseNotConfigured("login");
        return { ok: false, error: new Error("Supabase not configured") };
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error };
      return { ok: true, data };
    },
    [supabase, supabaseConfigured]
  );

  const signInWithOtp = useCallback(
    async (email) => {
      if (!supabaseConfigured || !supabase) {
        warnSupabaseNotConfigured("signInWithOtp");
        return { ok: false, error: new Error("Supabase not configured") };
      }
      // If you later add email-link confirmations, you may want to set emailRedirectTo using REACT_APP_FRONTEND_URL.
      const { data, error } = await supabase.auth.signInWithOtp({ email });
      if (error) return { ok: false, error };
      return { ok: true, data };
    },
    [supabase, supabaseConfigured]
  );

  const signInWithOAuth = useCallback(
    async (provider) => {
      if (!supabaseConfigured || !supabase) {
        warnSupabaseNotConfigured("signInWithOAuth");
        return { ok: false, error: new Error("Supabase not configured") };
      }
      const { data, error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) return { ok: false, error };
      return { ok: true, data };
    },
    [supabase, supabaseConfigured]
  );

  const logout = useCallback(async () => {
    if (!supabaseConfigured || !supabase) {
      warnSupabaseNotConfigured("logout");
      return { ok: true };
    }
    const { error } = await supabase.auth.signOut();
    if (error) return { ok: false, error };
    return { ok: true };
  }, [supabase, supabaseConfigured]);

  const getAccessToken = useCallback(async () => {
    if (!supabaseConfigured || !supabase) return null;
    // Prefer current session if present; otherwise re-fetch.
    if (session?.access_token) return session.access_token;
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token ?? null;
  }, [supabase, supabaseConfigured, session]);

  const value = useMemo(
    () => ({
      session,
      user,
      isAuthenticated,
      loading,
      login,
      logout,
      signInWithOtp,
      signInWithOAuth,
      getAccessToken,
    }),
    [session, user, isAuthenticated, loading, login, logout, signInWithOtp, signInWithOAuth, getAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * PUBLIC_INTERFACE
 * Hook to access auth context.
 *
 * @returns {{session:any,user:any,isAuthenticated:boolean,loading:boolean,login:Function,logout:Function,signInWithOtp:Function,signInWithOAuth:Function,getAccessToken:Function}}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

