import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./App.css";

import SidebarNav from "./components/SidebarNav";
import Navbar from "./components/Navbar";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import InsightsPage from "./pages/InsightsPage";
import AlertsPage from "./pages/AlertsPage";
import SettingsPage from "./pages/SettingsPage";

import { AuthProvider, useAuth } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { PreferencesProvider } from "./state/preferences";

function titleForPath(pathname) {
  if (pathname === "/" || pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/transactions")) return "Transactions";
  if (pathname.startsWith("/insights")) return "Insights";
  if (pathname.startsWith("/alerts")) return "Alerts";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/login")) return "Sign in";
  if (pathname.startsWith("/signup")) return "Create account";
  return "SpendSense";
}

const AUTH_ROUTES = ["/login", "/signup"];

// Routes that must never be accessible without an authenticated session.
// Note: "/" is treated as dashboard content in this app.
const PROTECTED_ROUTES = ["/", "/dashboard", "/transactions", "/insights", "/alerts", "/settings", "/profile"];

/**
 * Centralizes redirect behavior when the Supabase session changes.
 * - Before auth: only /login and /signup are accessible. Everything else => /login
 * - After auth: visiting /login or /signup => /dashboard
 */
function AuthGateRedirector() {
  const { isAuthenticated, loading } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;

    const path = loc.pathname || "/";
    const isAuthRoute = AUTH_ROUTES.some((p) => path === p || path.startsWith(`${p}/`));

    if (!isAuthenticated) {
      // Before login: ONLY /login and /signup should be accessible.
      if (!isAuthRoute) {
        nav("/login", { replace: true, state: { from: path } });
      }
      return;
    }

    // After login: if user is on /login or /signup, redirect to /dashboard.
    if (isAuthRoute) {
      nav("/dashboard", { replace: true });
    }
  }, [isAuthenticated, loading, loc.pathname, nav]);

  return null;
}

// PUBLIC_INTERFACE
function AppShell() {
  /** Root app: applies auth gating + renders full app shell only after authentication. */
  const loc = useLocation();
  const title = titleForPath(loc.pathname);

  const { isAuthenticated, loading } = useAuth();

  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  // Close mobile sidebar when navigating
  useEffect(() => {
    setSidebarOpenMobile(false);
  }, [loc.pathname]);

  const sidebarClass = useMemo(() => {
    return `ss-sidebar ${sidebarOpenMobile ? "is-mobile-open" : ""}`;
  }, [sidebarOpenMobile]);

  // While auth is resolving, do not render the full shell (prevents flicker).
  // We also avoid hard redirects here; AuthGateRedirector handles it once loading resolves.
  const showAuthedShell = isAuthenticated && !loading;

  return (
    <div className="ss-app">
      {/* Apply redirect logic on session changes / navigation */}
      <AuthGateRedirector />

      {showAuthedShell ? (
        <div className="ss-shell">
          {/* Mobile overlay backdrop */}
          <button
            type="button"
            className={`ss-sidebar-backdrop ${sidebarOpenMobile ? "is-open" : ""}`}
            aria-label="Close sidebar"
            onClick={() => setSidebarOpenMobile(false)}
          />

          <aside className={sidebarClass} aria-label="Sidebar">
            <div className="ss-brand" aria-label="SpendSense brand">
              <div className="ss-brand-mark" aria-hidden="true" />
              <div className="ss-brand-title">
                <strong>SpendSense</strong>
                <span>Analytics dashboard</span>
              </div>
            </div>
            <SidebarNav />
          </aside>

          <div className="ss-main">
            <Navbar title={title} onToggleSidebar={() => setSidebarOpenMobile((v) => !v)} />

            <div className="ss-content">
              <Routes>
                {/* Auth pages should not be reachable when authenticated (handled by AuthGateRedirector) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Protected app routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/transactions"
                  element={
                    <ProtectedRoute>
                      <TransactionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/insights"
                  element={
                    <ProtectedRoute>
                      <InsightsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/alerts"
                  element={
                    <ProtectedRoute>
                      <AlertsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* /profile is required by gating spec; page may be added in a later subtask.
                    Keep it protected now so direct navigation is correctly gated. */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <div style={{ padding: 16 }}>
                        <div className="ss-card" style={{ padding: 16 }}>
                          <div style={{ fontWeight: 800, marginBottom: 6 }}>Profile</div>
                          <div className="ss-muted" style={{ fontSize: 13 }}>
                            Profile page is not implemented yet.
                          </div>
                        </div>
                      </div>
                    </ProtectedRoute>
                  }
                />

                {/* fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      ) : (
        // Pre-auth (or while loading): show ONLY auth routes; no sidebar/topbar.
        <main className="ss-content" style={{ minHeight: "100vh" }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Before login: everything else redirects to /login */}
            {PROTECTED_ROUTES.map((p) => (
              <Route key={p} path={p} element={<Navigate to="/login" replace state={{ from: loc.pathname }} />} />
            ))}

            <Route path="*" element={<Navigate to="/login" replace state={{ from: loc.pathname } } />} />
          </Routes>
        </main>
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
export default function App() {
  /** App root that wires providers and renders the gated shell. */
  return (
    <AuthProvider>
      <PreferencesProvider>
        <AppShell />
      </PreferencesProvider>
    </AuthProvider>
  );
}
