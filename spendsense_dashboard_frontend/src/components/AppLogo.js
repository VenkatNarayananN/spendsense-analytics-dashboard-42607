import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const ASSETS = {
  full: "/assets/spendsense-logo.png",
  icon: "/assets/spendsense-icon.png",
};

const SIZE_MAP = {
  sm: { iconPx: 22, wordmarkPx: 13, gap: 8 },
  md: { iconPx: 28, wordmarkPx: 14, gap: 10 },
  lg: { iconPx: 38, wordmarkPx: 18, gap: 12 },
};

function sizeFor(size) {
  if (typeof size === "number") {
    const iconPx = size;
    return {
      iconPx,
      wordmarkPx: Math.max(12, Math.round(iconPx * 0.52)),
      gap: Math.max(6, Math.round(iconPx * 0.28)),
    };
  }
  return SIZE_MAP[size] ?? SIZE_MAP.md;
}

/**
 * PUBLIC_INTERFACE
 * SpendSense brand logo used across the app.
 *
 * This component supports:
 * - icon-only usage (topbar / collapsed areas)
 * - icon + wordmark usage (auth headers, larger brand blocks)
 *
 * Props:
 * - variant: "full" | "icon" (default: "full")
 * - size: "sm" | "md" | "lg" | number (default: "md")
 * - decorative: boolean (if true, renders empty alt text and aria-hidden)
 * - to: optional override navigation target. If omitted, navigates to:
 *    authenticated -> /dashboard
 *    unauthenticated -> /login
 * - showText: boolean (default: variant === "full")
 */
export default function AppLogo({
  variant = "full",
  size = "md",
  decorative = false,
  alt = "SpendSense logo",
  className = "",
  style = {},
  to,
  onClick,
  showText,
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { iconPx, wordmarkPx, gap } = useMemo(() => sizeFor(size), [size]);

  const a11yProps = decorative ? { alt: "", "aria-hidden": true } : { alt };

  // In this app, the logo is always clickable (navigates to dashboard/login).
  const dest = to ?? (isAuthenticated ? "/dashboard" : "/login");
  const textVisible = showText ?? variant === "full";

  return (
    <button
      type="button"
      className={`ss-applogo ${textVisible ? "is-full" : "is-icon"} ${className}`.trim()}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        navigate(dest);
      }}
      aria-label="Go to SpendSense home"
      style={{
        // IMPORTANT: by default, AppLogo should not bring its own “card/button chrome”.
        // Surfaces (sidebar/topbar/auth) control background/border when needed.
        appearance: "none",
        border: "none",
        background: "transparent",
        padding: 0,
        margin: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap,
        cursor: "pointer",
        lineHeight: 1,
        textAlign: "left",
        ...style,
      }}
    >
      <span
        className="ss-applogo-iconwrap"
        style={{
          width: iconPx,
          height: iconPx,
          borderRadius: 10,
          flex: "0 0 auto",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid color-mix(in srgb, var(--ss-border-color) 92%, transparent)",
          background: "color-mix(in srgb, var(--ss-card-bg) 42%, transparent)",
          boxShadow: "var(--ss-shadow-sm)",
          backdropFilter: "blur(10px)",
        }}
      >
        <img
          src={ASSETS.icon}
          {...a11yProps}
          style={{
            width: Math.round(iconPx * 0.92),
            height: Math.round(iconPx * 0.92),
            objectFit: "contain",
            display: "block",
            imageRendering: "auto",
          }}
        />
      </span>

      {textVisible ? (
        <span
          className="ss-applogo-wordmark"
          style={{
            fontSize: wordmarkPx,
            fontWeight: 900,
            letterSpacing: 0.1,
            color: "var(--ss-text-strong)",
            whiteSpace: "nowrap",
          }}
        >
          SpendSense
        </span>
      ) : null}
    </button>
  );
}
