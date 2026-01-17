import React from "react";

/* Reusable UI primitives; keeps pages clean and consistent with the style guide. */

// PUBLIC_INTERFACE
export function Card({ title, caption, right, children, className = "" }) {
  /** Styled surface card with optional header and right-aligned accessory. */
  return (
    <section className={`ss-card ${className}`}>
      <div className="ss-card-pad">
        {(title || caption || right) && (
          <div className="ss-card-header">
            <div>
              {title && <h3 className="ss-card-title">{title}</h3>}
              {caption && <p className="ss-card-caption">{caption}</p>}
            </div>
            {right ? <div>{right}</div> : null}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

// PUBLIC_INTERFACE
export function Chip({ tone = "primary", children, title }) {
  /** Badge/Chip for severity/status/tags. tone: primary|secondary|success|warn|error */
  const map = {
    primary: "ss-chip ss-chip-primary",
    secondary: "ss-chip ss-chip-secondary",
    success: "ss-chip ss-chip-success",
    warn: "ss-chip ss-chip-warn",
    error: "ss-chip ss-chip-error",
  };
  return (
    <span className={map[tone] || map.primary} title={title}>
      {children}
    </span>
  );
}

// PUBLIC_INTERFACE
export function Button({ variant = "primary", children, ...props }) {
  /** Buttons: primary|secondary|ghost. */
  const map = {
    primary: "ss-btn ss-btn-primary",
    secondary: "ss-btn ss-btn-secondary",
    ghost: "ss-btn ss-btn-ghost",
  };
  return (
    <button className={map[variant] || map.primary} {...props}>
      {children}
    </button>
  );
}

// PUBLIC_INTERFACE
export function PageHeader({ title, description, right }) {
  /** Page header with title/description and optional right-side actions. */
  return (
    <div className="ss-toolbar" role="region" aria-label={`${title} header`}>
      <div className="ss-toolbar-left" style={{ minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="ss-section-title">{title}</h1>
          {description ? <p className="ss-section-desc">{description}</p> : null}
        </div>
      </div>
      {right ? <div className="ss-toolbar-right">{right}</div> : null}
    </div>
  );
}

// PUBLIC_INTERFACE
export function LiveBadge({ status = "OFF", label = "Live" }) {
  /**
   * Small realtime indicator to communicate whether realtime subscriptions are active.
   *
   * status values are expected to be supabase-js channel status strings:
   * - "SUBSCRIBED" => connected
   * - "SUBSCRIBING" => connecting
   * - anything else => disconnected
   */
  const normalized = String(status || "OFF").toUpperCase();

  let cls = "ss-live is-disconnected";
  let text = label;

  if (normalized === "SUBSCRIBED") {
    cls = "ss-live is-connected";
    text = label;
  } else if (normalized === "SUBSCRIBING") {
    cls = "ss-live is-connecting";
    text = "Connecting…";
  } else if (normalized === "OFF") {
    cls = "ss-live is-disconnected";
    text = "Offline";
  } else {
    cls = "ss-live is-disconnected";
    text = "Disconnected";
  }

  return (
    <span className={cls} aria-label={`Realtime status: ${text}`} title={`Realtime status: ${normalized}`}>
      <span className="ss-live-dot" aria-hidden="true" />
      {text}
    </span>
  );
}
