import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button, Chip } from "./ui";
import { useAuth } from "../auth/AuthProvider";
import Logo from "./Logo";

function titleForPath(pathname) {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/transactions")) return "Transactions";
  if (pathname.startsWith("/insights")) return "Insights";
  if (pathname.startsWith("/alerts")) return "Alerts";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/protected")) return "Protected";
  if (pathname.startsWith("/login")) return "Login";
  return "SpendSense";
}

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/transactions", label: "Transactions" },
  { to: "/insights", label: "Insights" },
  { to: "/alerts", label: "Alerts" },
  { to: "/settings", label: "Settings" },
  { to: "/protected", label: "Protected" },
];

// PUBLIC_INTERFACE
export default function Navbar({ onToggleSidebar }) {
  /** Top navigation bar with mobile collapsible menu, theme-consistent styling, and auth stubs. */
  const loc = useLocation();
  const title = useMemo(() => titleForPath(loc.pathname), [loc.pathname]);
  const { isAuthenticated, login, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [loc.pathname]);

  return (
    <header className="ss-topbar" role="banner" aria-label="Top navigation bar">
      <div className="ss-topbar-left">
        <button
          type="button"
          className="ss-icon-btn ss-topbar-burger"
          aria-label="Toggle sidebar"
          onClick={() => onToggleSidebar?.()}
        >
          <span className="ss-burger" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <Logo
          size="sm"
          alt="SpendSense"
          style={{
            borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.18)",
          }}
        />

        <div style={{ minWidth: 0 }}>
          <div className="ss-topbar-title">{title}</div>
          <div className="ss-topbar-subtitle">Modern fintech UI • mock data</div>
        </div>
      </div>

      <div className="ss-topbar-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="ss-topbar-status" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isAuthenticated ? <Chip tone="success">Signed in</Chip> : <Chip tone="secondary">Guest</Chip>}
        </div>

        {isAuthenticated ? (
          <Button variant="ghost" onClick={() => logout()} aria-label="Logout (placeholder)">
            Logout
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => login()} aria-label="Login (placeholder)">
            Login
          </Button>
        )}

        <a
          href="https://example.com"
          onClick={(e) => e.preventDefault()}
          className="ss-topbar-help"
          style={{
            fontSize: 12,
            textDecoration: "none",
            border: "1px solid rgba(148,163,184,0.22)",
            borderRadius: 999,
            padding: "8px 10px",
            color: "rgba(229,231,235,0.92)",
            background:
              "linear-gradient(135deg, rgba(14,77,146,0.22), rgba(0,163,191,0.12))",
            backdropFilter: "blur(10px)",
          }}
          aria-label="Help (not implemented)"
        >
          Help
        </a>

        <button
          type="button"
          className="ss-icon-btn ss-topbar-menu-btn"
          aria-expanded={menuOpen}
          aria-controls="ss-topbar-menu"
          aria-label="Toggle top navigation menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="ss-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      <nav
        id="ss-topbar-menu"
        className={`ss-topbar-menu ${menuOpen ? "is-open" : ""}`}
        aria-label="Topbar navigation"
      >
        <div className="ss-topbar-menu-inner">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) => `ss-topbar-link ${isActive ? "is-active" : ""}`}
              aria-label={n.label}
            >
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}

