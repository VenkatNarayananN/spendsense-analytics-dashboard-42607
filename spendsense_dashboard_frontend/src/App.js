import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";

import SidebarNav from "./components/SidebarNav";
import Navbar from "./components/Navbar";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import InsightsPage from "./pages/InsightsPage";
import AlertsPage from "./pages/AlertsPage";
import SettingsPage from "./pages/SettingsPage";

import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import ProtectedExamplePage from "./pages/ProtectedExamplePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { PreferencesProvider } from "./state/preferences";

function titleForPath(pathname) {
  if (pathname === "/" || pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/transactions")) return "Transactions";
  if (pathname.startsWith("/insights")) return "Insights";
  if (pathname.startsWith("/alerts")) return "Alerts";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/protected")) return "Protected";
  if (pathname.startsWith("/login")) return "Sign in";
  if (pathname.startsWith("/signup")) return "Create account";
  return "SpendSense";
}

// PUBLIC_INTERFACE
function App() {
  /** Root app: elegant app shell with sidebar + responsive navbar and client-side routes. */
  const loc = useLocation();
  const title = titleForPath(loc.pathname);

  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  // Close mobile sidebar when navigating
  useEffect(() => {
    setSidebarOpenMobile(false);
  }, [loc.pathname]);

  const sidebarClass = useMemo(() => {
    return `ss-sidebar ${sidebarOpenMobile ? "is-mobile-open" : ""}`;
  }, [sidebarOpenMobile]);

  return (
    <AuthProvider>
      <PreferencesProvider>
        <div className="ss-app">
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
                  {/* Auth pages */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />

                  {/* Convenience route */}
                  <Route path="/dashboard" element={<Navigate to="/" replace />} />

                  {/* Protected app routes */}
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

                  {/* Kept as an explicit protected example */}
                  <Route
                    path="/protected"
                    element={
                      <ProtectedRoute>
                        <ProtectedExamplePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </div>
          </div>
        </div>
      </PreferencesProvider>
    </AuthProvider>
  );
}

export default App;
