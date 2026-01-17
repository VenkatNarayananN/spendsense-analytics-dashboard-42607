import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Auth scaffolding (placeholder).
 * - No real auth integration yet.
 * - Simulates an `isAuthenticated` boolean and exposes stubs for login/logout.
 */

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides simulated auth state and login/logout stubs to the app. */
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback(async () => {
    // Placeholder: in real implementation, call auth provider and set tokens.
    setIsAuthenticated(true);
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    // Placeholder: in real implementation, clear tokens/session.
    setIsAuthenticated(false);
    return { ok: true };
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      login,
      logout,
      // Placeholder user object for future use.
      user: isAuthenticated ? { id: "demo-user", name: "Demo User" } : null,
    }),
    [isAuthenticated, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access auth context. */
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

