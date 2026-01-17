import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Theme state (dark/light) for SpendSense.
 *
 * Implementation notes:
 * - Uses a `data-ss-theme` attribute on `document.documentElement` to switch CSS variables in App.css.
 * - Persists to localStorage so the preference survives reloads.
 * - We intentionally keep this separate from other preferences to avoid changing existing preference semantics.
 */

const STORAGE_KEY = "spendsense.theme.v1";

const ThemeContext = createContext(null);

function safeReadTheme() {
  if (typeof window === "undefined") return "dark";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "light" || raw === "dark" ? raw : "dark";
}

function applyThemeToDom(theme) {
  if (typeof document === "undefined") return;
  // Keep both attributes in sync so any CSS can target either selector.
  document.documentElement.setAttribute("data-ss-theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
}

// PUBLIC_INTERFACE
export function ThemeProvider({ children }) {
  /** Provides dark/light theme with local persistence (CSS variables are swapped via [data-ss-theme]). */
  const [theme, setTheme] = useState(() => safeReadTheme());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, theme);
    applyThemeToDom(theme);
  }, [theme]);

  // Apply once on mount to prevent a flash of wrong theme.
  useEffect(() => {
    applyThemeToDom(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// PUBLIC_INTERFACE
export function useTheme() {
  /** Hook to access theme state and toggle helper. */
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
