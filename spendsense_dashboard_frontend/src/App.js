import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";

import SidebarNav from "./components/SidebarNav";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import InsightsPage from "./pages/InsightsPage";
import AlertsPage from "./pages/AlertsPage";
import SettingsPage from "./pages/SettingsPage";

function titleForPath(pathname) {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/transactions")) return "Transactions";
  if (pathname.startsWith("/insights")) return "Insights";
  if (pathname.startsWith("/alerts")) return "Alerts";
  if (pathname.startsWith("/settings")) return "Settings";
  return "SpendSense";
}

// PUBLIC_INTERFACE
function App() {
  /** Root app: elegant app shell with sidebar + top app bar and client-side routes. */
  const loc = useLocation();
  const title = titleForPath(loc.pathname);

  return (
    <div className="ss-app">
      <div className="ss-shell">
        <aside className="ss-sidebar" aria-label="Sidebar">
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
          <header className="ss-topbar" role="banner" aria-label="Top bar">
            <div className="ss-topbar-left">
              <div style={{ minWidth: 0 }}>
                <div className="ss-topbar-title">{title}</div>
                <div className="ss-topbar-subtitle">Elegant Rose Gold • mock data</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <a
                href="https://example.com"
                onClick={(e) => e.preventDefault()}
                className="ss-muted"
                style={{
                  fontSize: 12,
                  textDecoration: "none",
                  border: "1px solid var(--ss-border)",
                  borderRadius: 999,
                  padding: "8px 10px",
                  background: "rgba(255,255,255,0.70)",
                }}
                aria-label="Help (not implemented)"
              >
                Help
              </a>
            </div>
          </header>

          <div className="ss-content">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
