import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const ASSETS = {
  full: "/assets/spendsense-logo.png",
  icon: "/assets/spendsense-icon.png",
};

const SIZE_MAP = {
  sm: { iconPx: 28, fullH: 26 },
  md: { iconPx: 36, fullH: 32 },
  lg: { iconPx: 48, fullH: 40 },
};

function sizeFor(size) {
  if (typeof size === "number") {
    return { iconPx: size, fullH: Math.max(18, Math.round(size * 0.84)) };
  }
  return SIZE_MAP[size] ?? SIZE_MAP.md;
}

/**
 * PUBLIC_INTERFACE
 * SpendSense brand logo used across the app.
 *
 * Props:
 * - variant: "full" | "icon" (default: "full")
 * - size: "sm" | "md" | "lg" | number (default: "md")
 * - decorative: boolean (if true, renders empty alt text and aria-hidden)
 * - to: optional override navigation target. If omitted, navigates to:
 *    authenticated -> /dashboard
 *    unauthenticated -> /login
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
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { iconPx, fullH } = useMemo(() => sizeFor(size), [size]);

  const src = variant === "icon" ? ASSETS.icon : ASSETS.full;

  const a11yProps = decorative ? { alt: "", "aria-hidden": true } : { alt };

  const clickable = Boolean(onClick) || to !== undefined || true;
  const dest = to ?? (isAuthenticated ? "/dashboard" : "/login");

  // Keep a stable box to avoid layout shift while image loads.
  const dims =
    variant === "icon"
      ? { width: iconPx, height: iconPx }
      : { height: fullH, width: "auto" };

  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        // Always navigate by default per requirements.
        navigate(dest);
      }}
      aria-label="Go to SpendSense home"
      style={{
        appearance: "none",
        border: "1px solid color-mix(in srgb, var(--ss-border-color) 85%, transparent)",
        background: "color-mix(in srgb, var(--ss-card-bg) 40%, transparent)",
        borderRadius: 16,
        padding: variant === "icon" ? 6 : 8,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "var(--ss-shadow-sm)",
        backdropFilter: "blur(10px)",
        cursor: clickable ? "pointer" : "default",
        lineHeight: 0,
        ...style,
      }}
    >
      <img
        src={src}
        {...a11yProps}
        style={{
          ...dims,
          objectFit: "contain",
          display: "block",
          // prevent pixelation/stretch: browser will scale but keep aspect
          imageRendering: "auto",
        }}
      />
    </button>
  );
}
