import React from "react";

/**
 * PUBLIC_INTERFACE
 * Reusable application logo component.
 *
 * Uses the public asset at `/assets/logo.jpeg`.
 *
 * Accessibility:
 * - If the logo is purely decorative, pass `decorative={true}` to set empty alt text and aria-hidden.
 * - Otherwise, provide `alt` (defaults to "SpendSense logo").
 */
export default function Logo({
  alt = "SpendSense logo",
  decorative = false,
  size = "md",
  className = "",
  style = {},
}) {
  const px = (() => {
    if (typeof size === "number") return size;
    const map = { xs: 18, sm: 24, md: 32, lg: 44, xl: 60 };
    return map[size] ?? map.md;
  })();

  const a11yProps = decorative ? { alt: "", "aria-hidden": true } : { alt };

  return (
    <img
      src="/assets/logo.jpeg"
      {...a11yProps}
      className={className}
      style={{
        width: px,
        height: px,
        objectFit: "contain",
        display: "inline-block",
        borderRadius: 12,
        boxShadow: "var(--ss-shadow-sm)",
        ...style,
      }}
    />
  );
}
