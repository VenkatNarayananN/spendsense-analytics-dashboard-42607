import React, { useEffect, useMemo, useState } from "react";
import { Card, Chip, LiveBadge, PageHeader } from "../components/ui";
import { AreaLineChart, BarChart } from "../components/charts";
import { EmptyState, FilterBar } from "../components/ux";
import { parsers, useURLQueryState } from "../components/urlState";
import { usePreferences } from "../state/preferences";
import { useAppData } from "../state/appData";
import { deriveInsights, deriveDashboardMetrics } from "../mock/demoData";

const toneLabel = {
  primary: "Info",
  secondary: "Heads-up",
  success: "Opportunity",
  error: "Needs review",
};

function timeframeLabel(tf) {
  if (tf === "7D") return "Last 7 days";
  if (tf === "30D") return "Last 30 days";
  if (tf === "90D") return "Last 90 days";
  return "Last 30 days";
}

function sliceTrend(trend30, tf) {
  if (!Array.isArray(trend30)) return [];
  if (tf === "7D") return trend30.slice(Math.max(0, trend30.length - 7));
  if (tf === "90D") return trend30; // demo: still 30-day series; in real app use 90-day series
  return trend30;
}

// PUBLIC_INTERFACE
export default function InsightsPage() {
  /** Insights that update from transaction data (demo or real), with URL-synced filters. */
  const { prefs } = usePreferences();

  const [filters, setFilters, resetFilters] = useURLQueryState({
    tf: { default: "30D", parse: parsers.string, serialize: (v) => String(v || "30D") },
    segment: { default: "All", parse: parsers.string, serialize: (v) => String(v || "All") },
  });

  const { transactions: ctxTransactions, loadingData, dataError, seedingState, realtimeStatus, refreshAll } = useAppData();

  // Keep warmup skeleton, also respect shared loading.
  const [pageWarmup, setPageWarmup] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setPageWarmup(false), 420);
    return () => window.clearTimeout(t);
  }, []);
  const isLoading = Boolean(pageWarmup || loadingData);

  const transactions = useMemo(() => (Array.isArray(ctxTransactions) ? ctxTransactions : []), [ctxTransactions]);

  const segments = useMemo(() => ["All", ...Array.from(new Set(transactions.map((t) => t.category)))], [transactions]);

  const insights = useMemo(() => deriveInsights(transactions), [transactions]);

  const filteredInsights = useMemo(() => {
    if (filters.segment === "All") return insights;
    const s = String(filters.segment).toLowerCase();
    return insights.filter((i) => `${i.title} ${i.detail}`.toLowerCase().includes(s));
  }, [insights, filters.segment]);

  const metrics = useMemo(
    () => deriveDashboardMetrics(transactions, { monthlyBudget: prefs.monthlyBudget }),
    [transactions, prefs.monthlyBudget]
  );

  const trend = useMemo(() => sliceTrend(metrics.spendTrend, filters.tf), [metrics.spendTrend, filters.tf]);

  const savings = useMemo(() => {
    /**
     * Simple "savings opportunities" demo:
     * Use the category breakdown and highlight the top 4 categories as areas to review.
     * (No ML jargon; user-friendly framing.)
     */
    const base = metrics.categoryBreakdown || [];
    const top = base.slice(0, 4).map((c) => ({
      label: c.label,
      value: Math.round(Math.max(5, c.value * 0.06)), // show an "estimated savings" number
    }));

    if (filters.segment === "All") return top;
    const s = String(filters.segment).toLowerCase();
    return top.filter((x) => x.label.toLowerCase().includes(s));
  }, [metrics.categoryBreakdown, filters.segment]);

  return (
    <main role="main" aria-label="Insights">
      <PageHeader
        title="Insights"
        description="Plain-English insights based on your transaction history — what changed, what’s frequent, and where to optimize."
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {!prefs.demoMode ? <LiveBadge status={realtimeStatus?.transactions} label="Live" /> : null}
          </div>
        }
      />

      <FilterBar
        title="Insights filters"
        onReset={() => resetFilters()}
        left={
          <>
            <label className="ss-muted" style={{ fontSize: 12 }}>
              Timeframe
              <select
                className="ss-select"
                value={filters.tf}
                onChange={(e) => setFilters((p) => ({ ...p, tf: e.target.value }))}
                aria-label="Select timeframe"
                style={{ minWidth: 180 }}
              >
                <option value="7D">7D</option>
                <option value="30D">30D</option>
                <option value="90D">90D</option>
              </select>
            </label>

            <label className="ss-muted" style={{ fontSize: 12 }}>
              Category
              <select
                className="ss-select"
                value={filters.segment}
                onChange={(e) => setFilters((p) => ({ ...p, segment: e.target.value }))}
                aria-label="Filter by category"
                style={{ minWidth: 180 }}
              >
                {segments.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </>
        }
        right={<div className="ss-muted" style={{ fontSize: 12 }}>{timeframeLabel(filters.tf)}</div>}
      />

      <div style={{ height: 8 }} />

      {!isLoading && (seedingState?.status === "failed" || dataError) ? (
        <div className="ss-card" role="status" aria-label="Data status message">
          <div className="ss-card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              <strong style={{ color: "var(--ss-text-primary)" }}>Notice:</strong>{" "}
              {seedingState?.status === "failed" ? seedingState.message : dataError}
            </div>
            <button type="button" className="ss-btn ss-btn-ghost" onClick={() => refreshAll()} aria-label="Retry loading data">
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="ss-grid ss-grid-3" aria-label="insights loading">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} title="Loading…" caption="Preparing insights">
              <div className="ss-skeleton" style={{ height: 12, width: "88%", borderRadius: 999 }} />
              <div style={{ height: 10 }} />
              <div className="ss-skeleton" style={{ height: 12, width: "72%", borderRadius: 999 }} />
              <div style={{ height: 14 }} />
              <div style={{ display: "flex", gap: 10 }}>
                <div className="ss-skeleton" style={{ height: 22, width: 80, borderRadius: 999 }} />
                <div className="ss-skeleton" style={{ height: 22, width: 90, borderRadius: 999 }} />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredInsights.length === 0 ? (
        <EmptyState
          title="No insights for this view"
          description="Try a different timeframe or remove the category filter to broaden the results."
          primaryAction={{ label: "Reset filters", onClick: () => resetFilters(), variant: "primary" }}
          secondaryAction={{ label: "Show all categories", onClick: () => setFilters((p) => ({ ...p, segment: "All" })), variant: "ghost" }}
        />
      ) : (
        <div className="ss-grid ss-grid-3" aria-label="insights list">
          {filteredInsights.map((i) => (
            <Card
              key={i.id}
              title={i.title}
              caption={i.detail}
              right={<Chip tone={i.tone}>{toneLabel[i.tone] || "Insight"}</Chip>}
            >
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                <Chip tone="primary">{i.kind}</Chip>
                <Chip tone="secondary">Based on last 30 days</Chip>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="ss-divider" />

      <div className="ss-grid ss-grid-2" aria-label="insights charts">
        <Card title="Spending trend" caption={`${timeframeLabel(filters.tf)} (derived)`}>
          <AreaLineChart
            title="Spend trend"
            data={trend}
            isLoading={isLoading}
            emptyMessage="No trend data available for this timeframe."
          />
        </Card>

        <Card title="Potential optimizations" caption="Simple estimated savings areas (derived)">
          <BarChart
            title="Savings areas"
            data={savings}
            isLoading={isLoading}
            emptyMessage="No savings opportunities are visible in this view."
          />
        </Card>
      </div>
    </main>
  );
}

