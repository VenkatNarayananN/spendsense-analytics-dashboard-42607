import React from "react";
import { NavLink } from "react-router-dom";
import { IconBell, IconGrid, IconList, IconSettings, IconSparkles } from "./icons";

const nav = [
  { to: "/", label: "Dashboard", Icon: IconGrid },
  { to: "/transactions", label: "Transactions", Icon: IconList },
  { to: "/insights", label: "Insights", Icon: IconSparkles },
  { to: "/alerts", label: "Alerts", Icon: IconBell },
  { to: "/settings", label: "Settings", Icon: IconSettings },
];

// PUBLIC_INTERFACE
export default function SidebarNav() {
  /** Sidebar navigation with icons and labels for the five pages. */
  return (
    <nav className="ss-nav" aria-label="Primary">
      {nav.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) => `ss-nav-item ${isActive ? "is-active" : ""}`}
          aria-label={label}
          aria-current={({ isActive }) => (isActive ? "page" : undefined)}
        >
          <span className="ss-nav-icon" aria-hidden="true">
            <Icon />
          </span>
          <span className="ss-nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
