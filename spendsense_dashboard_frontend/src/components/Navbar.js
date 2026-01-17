import React from "react";
import { useAuth } from "../auth/AuthProvider";
import { useTheme } from "../state/theme";
import AppLogo from "./AppLogo";
import PageContext from "./PageContext";
import TopbarProfileDropdown from "./TopbarProfileDropdown";

// PUBLIC_INTERFACE
export default function Navbar({ onToggleSidebar }) {
  /** Top navigation bar for authenticated users. */
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

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

        {/* Brand (left column): AppLogo + SpendSense text (responsive via CSS) */}
        <AppLogo variant="full" size="sm" alt="SpendSense logo" className="ss-topbar-logo" />
      </div>

      {/* Page context (middle column): dynamic title/subtitle from route */}
      <div className="ss-topbar-center" aria-label="Page context">
        <PageContext />
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
          <TopbarProfileDropdown />
          <span className="ss-topbar-signedin" aria-label={isAuthenticated ? "Signed in" : "Guest"}>
            {isAuthenticated ? "Signed in" : "Guest"}
          </span>
        </div>
      </div>
    </header>
  );
}
