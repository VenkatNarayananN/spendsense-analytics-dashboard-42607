import React, { useMemo, useState } from "react";
import { Button } from "./ui";

/**
 * Shared UX components:
 * - EmptyState: friendly empty messaging + optional CTAs
 * - FilterBar: consistent filter controls + mobile drawer
 * - Skeleton primitives
 */

// PUBLIC_INTERFACE
export function SkeletonBlock({ style, className = "" }) {
  /** A generic rectangular skeleton shimmer block. */
  return <div className={`ss-skeleton ${className}`} style={{ height: 12, ...style }} aria-hidden="true" />;
}

// PUBLIC_INTERFACE
export function SkeletonText({ lines = 2, lineHeight = 10 }) {
  /** Multi-line text skeleton. */
  const arr = useMemo(() => Array.from({ length: Math.max(1, lines) }), [lines]);
  return (
    <div aria-hidden="true" style={{ display: "grid", gap: 8 }}>
      {arr.map((_, i) => (
        <SkeletonBlock
          key={i}
          style={{
            height: lineHeight,
            width: i === arr.length - 1 ? "72%" : "92%",
            borderRadius: 999,
          }}
        />
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
export function EmptyState({ title, description, primaryAction, secondaryAction }) {
  /**
   * Friendly empty state with optional actions.
   * Actions: { label, onClick, variant?, ariaLabel? }
   */
  return (
    <div className="ss-empty" role="region" aria-label="Empty state">
      <div
        aria-hidden="true"
        style={{
          width: 46,
          height: 46,
          margin: "0 auto 10px auto",
          borderRadius: 14,
          border: "1px solid rgba(148,163,184,0.28)",
          background:
            "radial-gradient(18px 18px at 30% 30%, rgba(34,211,238,0.22), transparent 60%), radial-gradient(18px 18px at 70% 60%, rgba(99,102,241,0.18), transparent 62%), rgba(255,255,255,0.02)",
        }}
      />
      <div className="ss-empty-title">{title || "Nothing to show yet"}</div>
      {description ? <div className="ss-empty-desc">{description}</div> : null}

      {(primaryAction || secondaryAction) && (
        <div className="ss-empty-actions">
          {primaryAction ? (
            <Button
              variant={primaryAction.variant || "primary"}
              onClick={primaryAction.onClick}
              aria-label={primaryAction.ariaLabel || primaryAction.label}
            >
              {primaryAction.label}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button
              variant={secondaryAction.variant || "ghost"}
              onClick={secondaryAction.onClick}
              aria-label={secondaryAction.ariaLabel || secondaryAction.label}
            >
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
export function FilterBar({
  title = "Filters",
  left,
  right,
  mobileDrawerContent,
  onReset,
  onApply,
  applyLabel = "Apply",
  resetLabel = "Reset",
}) {
  /**
   * Consistent filter container.
   * - On desktop: renders left+right inline.
   * - On mobile: right side collapses into a drawer (use mobileDrawerContent).
   */
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div className="ss-filterbar" role="region" aria-label="Filters">
        <div className="ss-filterbar-inner">
          <div className="ss-filterbar-left">
            <Button
              variant="ghost"
              className="ss-filter-drawer-toggle"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open filters"
              type="button"
            >
              Filters
            </Button>
            {left}
          </div>

          <div className="ss-filterbar-right">{right}</div>

          <div className="ss-filterbar-actions">
            {onReset ? (
              <Button variant="ghost" onClick={onReset} aria-label="Reset filters" type="button">
                {resetLabel}
              </Button>
            ) : null}
            {onApply ? (
              <Button variant="secondary" onClick={onApply} aria-label="Apply filters" type="button">
                {applyLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`ss-filter-drawer ${drawerOpen ? "is-open" : ""}`} role="dialog" aria-label={`${title} drawer`}>
        <div className="ss-filter-drawer-panel">
          <h3>{title}</h3>

          <div className="ss-filter-drawer-grid">{mobileDrawerContent || right}</div>

          <div className="ss-filter-drawer-footer">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)} aria-label="Close filters" type="button">
              Close
            </Button>
            <div style={{ display: "flex", gap: 10 }}>
              {onReset ? (
                <Button variant="ghost" onClick={onReset} aria-label="Reset filters (drawer)" type="button">
                  {resetLabel}
                </Button>
              ) : null}
              {onApply ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    onApply();
                    setDrawerOpen(false);
                  }}
                  aria-label="Apply filters (drawer)"
                  type="button"
                >
                  {applyLabel}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
