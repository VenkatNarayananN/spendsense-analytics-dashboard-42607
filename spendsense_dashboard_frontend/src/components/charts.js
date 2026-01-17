import React, { useMemo } from "react";
import { EmptyState } from "./ux";

/**
 * Minimal SVG charts designed to be "drop-in replaceable" later.
 * They intentionally accept simple props and render accessible SVG.
 */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function fmtCurrency(n) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

function safeLen(v) {
  return Array.isArray(v) ? v.length : 0;
}

// PUBLIC_INTERFACE
export function AreaLineChart({ title, data, height = 180, isLoading = false, emptyMessage = "No data to chart yet." }) {
  /** Simple area chart for time series. data: [{label, value}] */
  const isEmpty = !isLoading && safeLen(data) === 0;

  const { points, min, max } = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return { points: [], min: 0, max: 0 };

    const vals = data.map((d) => d.value);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const span = maxV - minV || 1;
    const w = 600;
    const h = height;

    const pts = data.map((d, i) => {
      const x = (i / (data.length - 1 || 1)) * w;
      const y = h - ((d.value - minV) / span) * h;
      return { x, y, raw: d };
    });

    return { points: pts, min: minV, max: maxV };
  }, [data, height]);

  const path = useMemo(() => {
    if (points.length === 0) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  }, [points]);

  const area = useMemo(() => {
    if (points.length === 0) return "";
    const h = height;
    return `${path} L ${points[points.length - 1].x.toFixed(2)} ${h} L ${points[0].x.toFixed(2)} ${h} Z`;
  }, [path, points, height]);

  if (isLoading) {
    return (
      <figure aria-label={title} style={{ margin: 0 }}>
        <div className="ss-chart-skeleton" style={{ height }} role="img" aria-label={`${title} loading`}>
          <div className="ss-chart-shimmer" aria-hidden="true" />
        </div>
      </figure>
    );
  }

  if (isEmpty) {
    return (
      <figure aria-label={title} style={{ margin: 0 }}>
        <div style={{ height }}>
          <EmptyState title={title || "Chart"} description={emptyMessage} />
        </div>
      </figure>
    );
  }

  return (
    <figure aria-label={title} style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 600 ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={title}
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="ssAreaFin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        <path d={area} fill="url(#ssAreaFin)" />
        <path d={path} fill="none" stroke="#22D3EE" strokeWidth="3" />

        {/* top/bottom labels */}
        <text x="6" y="16" fontSize="12" fill="rgba(255,255,255,0.70)">
          {fmtCurrency(max)}
        </text>
        <text x="6" y={height - 8} fontSize="12" fill="rgba(255,255,255,0.70)">
          {fmtCurrency(min)}
        </text>
      </svg>
    </figure>
  );
}

// PUBLIC_INTERFACE
export function BarChart({ title, data, height = 180, isLoading = false, emptyMessage = "No data to chart yet." }) {
  /** Simple bar chart. data: [{label, value}] */
  const isEmpty = !isLoading && safeLen(data) === 0;
  const max = Math.max(...(Array.isArray(data) ? data.map((d) => d.value) : []), 1);

  if (isLoading) {
    return (
      <figure aria-label={title} style={{ margin: 0 }}>
        <div className="ss-chart-skeleton" style={{ height }} role="img" aria-label={`${title} loading`}>
          <div className="ss-chart-shimmer" aria-hidden="true" />
        </div>
      </figure>
    );
  }

  if (isEmpty) {
    return (
      <figure aria-label={title} style={{ margin: 0 }}>
        <div style={{ height }}>
          <EmptyState title={title || "Chart"} description={emptyMessage} />
        </div>
      </figure>
    );
  }

  return (
    <figure aria-label={title} style={{ margin: 0 }}>
      <svg viewBox={`0 0 600 ${height}`} width="100%" height={height} role="img" aria-label={title}>
        {data.map((d, i) => {
          const w = 600 / (data.length || 1);
          const x = i * w + 10;
          const bw = w - 20;
          const h = clamp((d.value / max) * (height - 28), 0, height);
          const y = height - 18 - h;

          return (
            <g key={d.label}>
              <rect x={x} y={y} width={bw} height={h} rx="10" fill="rgba(99,102,241,0.26)" />
              <rect x={x} y={y} width={bw} height={Math.max(2, h * 0.6)} rx="10" fill="rgba(34,211,238,0.26)" />
              <text x={x + bw / 2} y={height - 6} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.70)">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
