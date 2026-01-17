import React from "react";
import AppLogo from "./AppLogo";

/**
 * PUBLIC_INTERFACE
 * Backwards-compatible wrapper around <AppLogo />.
 *
 * New code should import and use <AppLogo /> directly.
 */
export default function Logo({ alt = "SpendSense logo", decorative = false, size = "md", className = "", style = {} }) {
  return <AppLogo variant="icon" alt={alt} decorative={decorative} size={size} className={className} style={style} />;
}
