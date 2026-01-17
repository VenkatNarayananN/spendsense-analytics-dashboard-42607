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

      <div className="ss-topbar-right">
        <button
          type="button"
          className="ss-theme-pill"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Theme: ${theme === "dark" ? "Dark" : "Light"}`}
          onClick={() => toggleTheme()}
        >
          <span className="ss-theme-pill-label" aria-hidden="true">
            {theme === "dark" ? "Dark" : "Light"}
          </span>
          <span className="ss-theme-pill-caret" aria-hidden="true" />
        </button>

        {/* Profile control (avatar/initials + name/email) with dropdown actions */}
        <div className="ss-topbar-profgroup">
          <span className="ss-topbar-signedin" aria-label={isAuthenticated ? "Signed in" : "Guest"}>
            {isAuthenticated ? "Signed in" : "Guest"}
          </span>
          <TopbarProfileDropdown />
        </div>
      </div>
    </header>
  );
}
