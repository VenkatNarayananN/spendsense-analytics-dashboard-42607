import React, { useEffect, useMemo, useState } from "react";
import { Card, Chip, PageHeader } from "../components/ui";
import { AreaLineChart, BarChart } from "../components/charts";
import { getInsightsMock } from "../mock/mockData";
import { EmptyState, FilterBar } from "../components/ux";
import { parsers, useURLQueryState } from "../components/urlState";

const toneLabel = {
  primary: "Info",
  secondary: "Heads-up",
  success: "Opportunity",
  error: "Anomaly",
};

function timeframeLabel(tf) {
  if (tf === "7D") return "Last 7 days";
  if (tf === "30D") return "Last 30 days";
  if (tf === "90D") return "Last 90 days";
  return "Last 30 days";
}

// PUBLIC_INTERFACE
export default function InsightsPage() {
  /** Insights cards and trend visuals (mock data), with URL-synced filters and empty/loading UX. */
  const raw = useMemo(() => getInsightsMock(), []);

  const [filters, setFilters, resetFilters] = useURLQueryState({
    tf: { default: "30D", parse: parsers.string, serialize: (v) => String(v || "30D") },
    segment: { default: "All", parse: parsers.string, serialize: (v) => String(v || "All") },
  });

  // Simulated loading
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setIsLoading(false), 420);
    return () => window.clearTimeout(t);
  }, []);

  const segments = useMemo(() => ["All", "Dining", "Shopping", "Bills", "Transport"], []);
  const filteredInsights = useMemo(() => {
    if (filters.segment === "All") return raw.insights;

    // Simple mapping: treat segment as keyword contains
    const s = String(filters.segment).toLowerCase();
    return raw.insights.filter((i) => `${i.title} ${i.detail}`.toLowerCase().includes(s));
  }, [raw.insights, filters.segment]);

  // Timeframe affects chart sampling (mock behavior): just slice lengths.
  const trend = useMemo(() => {
    if (filters.tf === "7D") return raw.spendTrend.slice(Math.max(0, raw.spendTrend.length - 3));
    if (filters.tf === "90D") return raw.spendTrend; // keep full
    return raw.spendTrend.slice(Math.max(0, raw.spendTrend.length - 5));
  }, [raw.spendTrend, filters.tf]);

  const savings = useMemo(() => {
    if (filters.segment === "All") return raw.savingsByArea;
    const s = String(filters.segment).toLowerCase();
    return raw.savingsByArea.filter((x) => x.label.toLowerCase().includes(s));
  }, [raw.savingsByArea, filters.segment]);

  const reset = () => resetFilters();

  return (
    <main role="main" aria-label="Insights">
      <PageHeader
        title="Insights"
        description="Actionable insights from your spending patterns — anomalies, trends, and savings opportunities."
        right={<Chip tone="secondary">{isLoading ? "Loading…" : `${filteredInsights.length} insights`}</Chip>}
      />

      <FilterBar
        title="Insights filters"
        onReset={reset}
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
              Segment
              <select
                className="ss-select"
                value={filters.segment}
                onChange={(e) => setFilters((p) => ({ ...p, segment: e.target.value }))}
                aria-label="Filter by segment/category"
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
        mobileDrawerContent={
          <>
            <div className="ss-muted" style={{ fontSize: 12 }}>
              Tip: These filters persist in the URL so you can share a specific insight view.
            </div>
          </>
        }
      />

      <div style={{ height: 12 }} />

      {isLoading ? (
        <div className="ss-grid ss-grid-3" aria-label="insights loading">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} title="Loading…" caption="Fetching insights">
              <div className="ss-skeleton" style={{ height: 12, width: "88%", borderRadius: 999 }} />
              <div style={{ height: 10 }} />
              <div className="ss-skeleton" style={{ height: 12, width: "72%", borderRadius: 999 }} />
              <div style={{ height: 14 }} />
              <div style={{ display: "flex", gap: 10 }}>
                <div className="ss-skeleton" style={{ height: 22, width: 60, borderRadius: 999 }} />
                <div className="ss-skeleton" style={{ height: 22, width: 70, borderRadius: 999 }} />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredInsights.length === 0 ? (
        <EmptyState
          title="No insights for this view"
          description="Try a different timeframe or remove the segment filter to broaden the results."
          primaryAction={{ label: "Reset filters", onClick: reset, variant: "primary" }}
          secondaryAction={{ label: "Try 90D timeframe", onClick: () => setFilters((p) => ({ ...p, tf: "90D" })), variant: "ghost" }}
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
                <Chip tone="primary">Mock</Chip>
                <Chip tone="secondary">Review</Chip>
                {i.tone === "error" ? <Chip tone="error">Investigate</Chip> : null}
                {i.tone === "success" ? <Chip tone="success">Save</Chip> : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="ss-divider" />

      <div className="ss-grid ss-grid-2" aria-label="insights charts">
        <Card title="Spend Trend" caption={`${timeframeLabel(filters.tf)} (mock)`}>
          <AreaLineChart
            title="Spend trend"
            data={trend}
            isLoading={isLoading}
            emptyMessage="No trend data for this timeframe. Try expanding the timeframe."
          />
        </Card>

        <Card title="Potential Savings" caption="Estimated monthly savings areas (mock)">
          <BarChart
            title="Savings breakdown"
            data={savings}
            isLoading={isLoading}
            emptyMessage="No savings opportunities for this segment. Try a different segment or timeframe."
          />
        </Card>
      </div>
    </main>
  );
}
