import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Chip } from "./ui";
import { useAuth } from "../auth/AuthProvider";
import { useTheme } from "../state/theme";
import Logo from "./Logo";
import TopbarProfileDropdown from "./TopbarProfileDropdown";

function titleForPath(pathname) {
  if (pathname === "/dashboard" || pathname === "/") return "Dashboard";
  if (pathname.startsWith("/transactions")) return "Transactions";
  if (pathname.startsWith("/insights")) return "Insights";
  if (pathname.startsWith("/alerts")) return "Alerts";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/login")) return "Login";
  return "SpendSense";
}

const nav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/transactions", label: "Transactions" },
  { to: "/insights", label: "Insights" },
  { to: "/alerts", label: "Alerts" },
  { to: "/settings", label: "Settings" },
];

// PUBLIC_INTERFACE
export default function Navbar({ onToggleSidebar }) {
  /** Top navigation bar for authenticated users. */
  const loc = useLocation();
  const navigate = useNavigate();
  const title = useMemo(() => titleForPath(loc.pathname), [loc.pathname]);

  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
            background: "color-mix(in srgb, var(--ss-card-bg) 45%, transparent)",
            border: "1px solid var(--ss-border-color)",
          }}
        />

        <div style={{ minWidth: 0 }}>
          <div className="ss-topbar-title">{title}</div>
          <div className="ss-topbar-subtitle">Modern fintech UI</div>
        </div>
      </div>

      <div className="ss-topbar-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="ss-topbar-status" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isAuthenticated ? <Chip tone="success">Signed in</Chip> : <Chip tone="secondary">Guest</Chip>}
        </div>

        <button
          type="button"
          className="ss-icon-btn"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Theme: ${theme === "dark" ? "Dark" : "Light"}`}
          onClick={() => toggleTheme()}
        >
          <span aria-hidden="true" style={{ fontWeight: 950, fontSize: 12 }}>
            {theme === "dark" ? "Dark" : "Light"}
          </span>
        </button>

        {/* Profile control (avatar/initials + name/email) with dropdown actions */}
        <TopbarProfileDropdown />

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

      <nav id="ss-topbar-menu" className={`ss-topbar-menu ${menuOpen ? "is-open" : ""}`} aria-label="Topbar navigation">
        <div className="ss-topbar-menu-inner">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/dashboard"}
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
