import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";

/**
 * Route-aware page title/subtitle mapping for the topbar.
 * Keep this focused on existing routes only (per requirement: do not change routes).
 */
function contextForPath(pathname) {
  if (pathname === "/" || pathname === "/dashboard") {
    return { title: "Dashboard", subtitle: "Overview of your finances" };
  }
  if (pathname.startsWith("/transactions")) {
    return { title: "Transactions", subtitle: "Search, filter, and review activity" };
  }
  if (pathname.startsWith("/insights")) {
    return { title: "Insights", subtitle: "Trends and spending patterns" };
  }
  if (pathname.startsWith("/alerts")) {
    return { title: "Alerts", subtitle: "Notifications and rules" };
  }
  if (pathname.startsWith("/settings")) {
    return { title: "Settings", subtitle: "Preferences and configuration" };
  }
  if (pathname.startsWith("/profile")) {
    return { title: "Profile", subtitle: "Your account details" };
  }
  if (pathname.startsWith("/login")) {
    return { title: "Login", subtitle: "Sign in to continue" };
  }
  if (pathname.startsWith("/signup")) {
    return { title: "Create account", subtitle: "Start using SpendSense" };
  }

  return { title: "SpendSense", subtitle: "Modern fintech UI" };
}

// PUBLIC_INTERFACE
export default function PageContext({ className = "", align = "center" }) {
  /** Displays a route-aware page title and subtitle for the topbar. */
  const loc = useLocation();
  const ctx = useMemo(() => contextForPath(loc.pathname), [loc.pathname]);

  return (
    <div className={`ss-pagecontext ss-pagecontext-${align} ${className}`.trim()} style={{ minWidth: 0 }}>
      <div className="ss-pagecontext-title" title={ctx.title}>
        {ctx.title}
      </div>
      <div className="ss-pagecontext-subtitle" title={ctx.subtitle}>
        {ctx.subtitle}
      </div>
    </div>
  );
}
