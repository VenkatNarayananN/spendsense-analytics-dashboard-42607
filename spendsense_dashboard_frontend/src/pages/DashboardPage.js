import React, { useEffect, useMemo, useState } from "react";
import { Card, Chip, PageHeader } from "../components/ui";
import { AreaLineChart, BarChart } from "../components/charts";
import { getDashboardMock } from "../mock/mockData";
import { EmptyState, FilterBar } from "../components/ux";

function fmtCurrency(n) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

function sliceForTimeframe(arr, tf) {
  if (!Array.isArray(arr)) return [];
  if (tf === "7D") return arr.slice(Math.max(0, arr.length - 7));
  if (tf === "90D") return arr; // mock: show full
  return arr.slice(Math.max(0, arr.length - 14));
}

// PUBLIC_INTERFACE
export default function DashboardPage() {
  /** Dashboard with summary cards and charts using mock data, plus timeframe and loading/empty UX. */
  const data = useMemo(() => getDashboardMock(), []);
  const [timeframe, setTimeframe] = useState("30D");

  // Simulated loading
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setIsLoading(false), 380);
    return () => window.clearTimeout(t);
  }, []);

  const series = useMemo(() => sliceForTimeframe(data.spendSeries, timeframe), [data.spendSeries, timeframe]);
  const cats = useMemo(() => data.categoryDistribution || [], [data.categoryDistribution]);
  const hasAnyData = series.length > 0 || cats.length > 0;

  return (
    <main role="main" aria-label="Dashboard">
      <PageHeader
        title="Dashboard"
        description="A quick overview of spend, budget utilization, and category distribution."
        right={<Chip tone="primary">Fintech</Chip>}
      />

      <FilterBar
        title="Dashboard timeframe"
        left={
          <label className="ss-muted" style={{ fontSize: 12 }}>
            Timeframe
            <select
              className="ss-select"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              aria-label="Dashboard timeframe selector"
              style={{ minWidth: 180 }}
            >
              <option value="7D">7D</option>
              <option value="30D">30D</option>
              <option value="90D">90D</option>
            </select>
          </label>
        }
        right={<div className="ss-muted" style={{ fontSize: 12 }}>Affects charts and summaries</div>}
        onReset={() => setTimeframe("30D")}
      />

      <div style={{ height: 12 }} />

      {!isLoading && !hasAnyData ? (
        <EmptyState
          title="No data yet"
          description="Connect an account or import transactions to populate your dashboard."
          primaryAction={{ label: "Import transactions", onClick: () => {}, variant: "primary" }}
          secondaryAction={{ label: "View transactions", onClick: () => (window.location.href = "/transactions"), variant: "ghost" }}
        />
      ) : (
        <>
          <div className="ss-grid ss-grid-3" aria-label="summary cards">
            <Card title="Spend Total" caption={`${timeframe} (mock)`}>
              {isLoading ? (
                <div className="ss-skeleton" style={{ height: 28, width: 160, borderRadius: 12 }} />
              ) : (
                <div className="ss-kpi">
                  <strong>{fmtCurrency(data.spendTotal)}</strong>
                  <span className="ss-muted">across {cats.length} categories</span>
                </div>
              )}
            </Card>

            <Card
              title="Budget Utilization"
              caption={`Budget: ${fmtCurrency(data.budget)} (mock)`}
              right={
                isLoading ? (
                  <span className="ss-skeleton" style={{ width: 54, height: 22, borderRadius: 999, display: "inline-block" }} />
                ) : (
                  <Chip tone={data.utilization >= 85 ? "error" : data.utilization >= 70 ? "warn" : "success"}>{data.utilization}%</Chip>
                )
              }
            >
              <div style={{ marginTop: 14 }}>
                <div
                  aria-label="Budget utilization bar"
                  style={{
                    height: 12,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: isLoading ? "45%" : `${Math.min(100, data.utilization)}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #22D3EE, #6366F1)",
                      transition: "width 220ms ease",
                    }}
                  />
                </div>
                <p className="ss-card-caption" style={{ marginTop: 10 }}>
                  Keep utilization under <strong>80%</strong> for more flexibility.
                </p>
              </div>
            </Card>

            <Card title="Top Category" caption="Highest contribution (mock)" right={isLoading ? null : <Chip tone="secondary">{data.topCategory.label}</Chip>}>
              {isLoading ? (
                <div className="ss-skeleton" style={{ height: 28, width: 140, borderRadius: 12 }} />
              ) : (
                <div className="ss-kpi">
                  <strong>{fmtCurrency(data.topCategory.value)}</strong>
                  <span className="ss-muted">this period</span>
                </div>
              )}
            </Card>
          </div>

          <div className="ss-divider" />

          <div className="ss-grid ss-grid-2" aria-label="dashboard charts">
            <Card title="Spend Over Time" caption={`${timeframe} trend (mock)`}>
              <AreaLineChart
                title="Spend over time"
                data={series}
                isLoading={isLoading}
                emptyMessage="No spend series for this timeframe. Try expanding the timeframe."
              />
            </Card>

            <Card title="Category Distribution" caption="Total spend by category (mock)">
              <BarChart
                title="Category distribution"
                data={cats}
                isLoading={isLoading}
                emptyMessage="No category totals available yet. Import transactions to populate categories."
              />
            </Card>
          </div>
        </>
      )}
    </main>
  );
}
