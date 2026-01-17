import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * App preferences + profile state.
 *
 * Notes:
 * - "Demo mode" must affect ONLY analytics pages: Dashboard, Transactions, Insights, Alerts.
 * - Profile must remain Supabase-backed in production. Today we don't have Supabase auth wired, so we
 *   store the profile locally as a placeholder to keep Settings UX demo-ready.
 */

const STORAGE_KEY = "spendsense.preferences.v1";
const PROFILE_KEY = "spendsense.profile.v1";

const PreferencesContext = createContext(null);

function safeParseJSON(raw, fallback) {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function readStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  return safeParseJSON(window.localStorage.getItem(key), fallback);
}

function writeStorage(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// PUBLIC_INTERFACE
export function PreferencesProvider({ children }) {
  /** Provides preferences (demo mode, currency, budget, alert toggles) and a profile stub. */
  const [prefs, setPrefs] = useState(() =>
    readStorage(STORAGE_KEY, {
      demoMode: true,
      currency: "USD",
      monthlyBudget: 2200,
      alertsEnabled: true,
    })
  );

  const [profile, setProfile] = useState(() =>
    readStorage(PROFILE_KEY, {
      // In a real app, email comes from auth provider and is read-only.
      email: "alex.morgan@spendsense.demo",
      name: "Alex Morgan",
      phone: "",
      // Store a data URL string or external URL; keep optional.
      avatarUrl: "",
    })
  );

  useEffect(() => {
    writeStorage(STORAGE_KEY, prefs);
  }, [prefs]);

  useEffect(() => {
    writeStorage(PROFILE_KEY, profile);
  }, [profile]);

  const value = useMemo(
    () => ({
      prefs,
      setPrefs,
      profile,
      setProfile,
    }),
    [prefs, profile]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

// PUBLIC_INTERFACE
export function usePreferences() {
  /** Hook to access preferences and profile state. */
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within a PreferencesProvider");
  return ctx;
}

