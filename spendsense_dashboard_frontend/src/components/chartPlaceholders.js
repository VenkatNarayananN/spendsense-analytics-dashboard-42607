import React, { useMemo } from "react";

/**
 * Chart placeholders: skeleton/empty states now, "drop-in replaceable" later.
 * No external chart dependencies are used.
 */

function safeLen(v) {
  return Array.isArray(v) ? v.length : 0;
}

// PUBLIC_INTERFACE
export function LineChartPlaceholder({ title, data, height = 180, loading = false, emptyMessage = "No data yet." }) {
  /** Placeholder line chart that accepts future chart props; shows skeleton or empty message. */
  const isEmpty = useMemo(() => !loading && safeLen(data) === 0, [loading, data]);

  return (
    <figure aria-label={title} style={{ margin: 0 }}>
      <div className="ss-chart-skeleton" style={{ height }} role="img" aria-label={title}>
        {loading ? (
          <div className="ss-chart-shimmer" aria-hidden="true" />
        ) : isEmpty ? (
          <div className="ss-chart-empty">
            <div style={{ fontWeight: 900, fontSize: 13 }}>{title || "Line chart"}</div>
            <div className="ss-muted" style={{ fontSize: 12, marginTop: 6 }}>
              {emptyMessage}
            </div>
          </div>
        ) : (
          <div className="ss-chart-empty">
            <div style={{ fontWeight: 900, fontSize: 13 }}>{title || "Line chart"}</div>
            <div className="ss-muted" style={{ fontSize: 12, marginTop: 6 }}>
              Data received ({safeLen(data)} points) — placeholder rendering
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}

// PUBLIC_INTERFACE
export function BarChartPlaceholder({ title, data, height = 180, loading = false, emptyMessage = "No data yet." }) {
  /** Placeholder bar chart that accepts future chart props; shows skeleton or empty message. */
  const isEmpty = useMemo(() => !loading && safeLen(data) === 0, [loading, data]);

  return (
    <figure aria-label={title} style={{ margin: 0 }}>
      <div className="ss-chart-skeleton" style={{ height }} role="img" aria-label={title}>
        {loading ? (
          <div className="ss-chart-shimmer" aria-hidden="true" />
        ) : isEmpty ? (
          <div className="ss-chart-empty">
            <div style={{ fontWeight: 900, fontSize: 13 }}>{title || "Bar chart"}</div>
            <div className="ss-muted" style={{ fontSize: 12, marginTop: 6 }}>
              {emptyMessage}
            </div>
          </div>
        ) : (
          <div className="ss-chart-empty">
            <div style={{ fontWeight: 900, fontSize: 13 }}>{title || "Bar chart"}</div>
            <div className="ss-muted" style={{ fontSize: 12, marginTop: 6 }}>
              Data received ({safeLen(data)} bars) — placeholder rendering
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}

