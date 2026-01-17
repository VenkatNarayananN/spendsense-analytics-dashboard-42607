import React, { useEffect, useMemo, useState } from "react";
import { Card, Chip, PageHeader } from "../components/ui";
import { AreaLineChart, BarChart } from "../components/charts";
import { EmptyState, FilterBar } from "../components/ux";
import { usePreferences } from "../state/preferences";
import {
  categoryHighlight,
  deriveAlerts,
  deriveDashboardMetrics,
  generateDemoTransactions,
  merchantHighlight,
  monthSpendComparison,
} from "../mock/demoData";

function fmtCurrency(n, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `$${Number(n || 0).toFixed(2)}`;
  }
}

// PUBLIC_INTERFACE
export default function DashboardPage() {
  /** Dashboard: realistic KPIs, category breakdown, spending trend, and plain-English highlights. */
  const { prefs } = usePreferences();

  // Simulated loading (bounded; no infinite loaders)
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setIsLoading(false), 420);
    return () => window.clearTimeout(t);
  }, []);

  /**
   * Data source strategy:
   * - Until backend is wired, "real data" is unavailable, so we fall back to demo.
   * - Demo mode toggle must affect ONLY analytics pages; this page is analytics => obey demoMode.
   */
  const transactions = useMemo(() => {
    const demo = generateDemoTransactions({ seed: 42, count: 52, currency: prefs.currency });
    return prefs.demoMode ? demo : demo; // placeholder: when real data exists, use it here if demoMode=false
  }, [prefs.demoMode, prefs.currency]);

  const metrics = useMemo(
    () => deriveDashboardMetrics(transactions, { monthlyBudget: prefs.monthlyBudget }),
    [transactions, prefs.monthlyBudget]
  );

  const alerts = useMemo(
    () => deriveAlerts(transactions, { monthlyBudget: prefs.monthlyBudget, alertsEnabled: prefs.alertsEnabled }),
    [transactions, prefs.monthlyBudget, prefs.alertsEnabled]
  );

  const highlight1 = useMemo(() => monthSpendComparison(transactions), [transactions]);
  const highlight2 = useMemo(() => categoryHighlight(transactions), [transactions]);
  const highlight3 = useMemo(() => merchantHighlight(transactions), [transactions]);

  const hasAnyData = transactions.length > 0;

  return (
    <main role="main" aria-label="Dashboard">
      <PageHeader
        title="Dashboard"
        description="A quick overview of this month’s spending, budget health, and category mix."
        right={<Chip tone={prefs.demoMode ? "secondary" : "primary"}>{prefs.demoMode ? "Demo mode" : "Live"}</Chip>}
      />

      <FilterBar
        title="Dashboard context"
        left={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Chip tone="primary">Current month</Chip>
            <Chip tone="secondary">{prefs.currency}</Chip>
            <Chip tone={prefs.alertsEnabled ? "success" : "warn"}>{prefs.alertsEnabled ? "Alerts on" : "Alerts off"}</Chip>
          </div>
        }
        right={<div className="ss-muted" style={{ fontSize: 12 }}>KPIs reflect the current calendar month</div>}
      />

      <div style={{ height: 12 }} />

      {!isLoading && !hasAnyData ? (
        <EmptyState
          title="No data yet"
          description="Connect an account or import transactions to populate your dashboard."
          primaryAction={{ label: "Import transactions", onClick: () => {}, variant: "primary" }}
          secondaryAction={{
            label: "Go to transactions",
            onClick: () => (window.location.href = "/transactions"),
            variant: "ghost",
          }}
        />
      ) : (
        <>
          {/* KPI cards required by spec */}
          <div className="ss-grid ss-grid-3" aria-label="summary cards">
            <Card title="Total spend" caption="Current month">
              {isLoading ? (
                <div className="ss-skeleton" style={{ height: 28, width: 180, borderRadius: 12 }} />
              ) : (
                <div className="ss-kpi">
                  <strong>{fmtCurrency(metrics.totalSpend, prefs.currency)}</strong>
                  <span className="ss-muted">budget {fmtCurrency(prefs.monthlyBudget, prefs.currency)}</span>
                </div>
              )}
            </Card>

            <Card title="Avg daily spend" caption="Based on days with activity">
              {isLoading ? (
                <div className="ss-skeleton" style={{ height: 28, width: 160, borderRadius: 12 }} />
              ) : (
                <div className="ss-kpi">
                  <strong>{fmtCurrency(metrics.avgDaily, prefs.currency)}</strong>
                  <span className="ss-muted">per active day</span>
                </div>
              )}
            </Card>

            <Card title="Top category" caption="Current month" right={isLoading ? null : <Chip tone="secondary">{metrics.topCategory.label}</Chip>}>
              {isLoading ? (
                <div className="ss-skeleton" style={{ height: 28, width: 140, borderRadius: 12 }} />
              ) : (
                <div className="ss-kpi">
                  <strong>{fmtCurrency(metrics.topCategory.value, prefs.currency)}</strong>
                  <span className="ss-muted">largest category total</span>
                </div>
              )}
            </Card>

            <Card
              title="Budget utilization"
              caption="Current month"
              right={
                isLoading ? (
                  <span className="ss-skeleton" style={{ width: 54, height: 22, borderRadius: 999, display: "inline-block" }} />
                ) : (
                  <Chip tone={metrics.utilization >= 90 ? "error" : metrics.utilization >= 80 ? "warn" : "success"}>
                    {Math.max(0, metrics.utilization)}%
                  </Chip>
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
                      width: isLoading ? "40%" : `${Math.min(100, Math.max(0, metrics.utilization))}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, var(--ss-secondary), var(--ss-primary))",
                      transition: "width 220ms ease",
                    }}
                  />
                </div>
                <p className="ss-card-caption" style={{ marginTop: 10 }}>
                  A good target is staying under <strong>80%</strong> until the final week of the month.
                </p>
              </div>
            </Card>

            <Card title="Alerts" caption="Needs attention">
              {isLoading ? (
                <div className="ss-skeleton" style={{ height: 28, width: 120, borderRadius: 12 }} />
              ) : (
                <div className="ss-kpi">
                  <strong>{alerts.filter((a) => a.status === "open").length}</strong>
                  <span className="ss-muted">open alerts</span>
                </div>
              )}
            </Card>
          </div>

          <div className="ss-divider" />

          {/* Highlights in plain English */}
          <div className="ss-grid ss-grid-3" aria-label="dashboard highlights">
            <Card title="Highlight" caption="Monthly comparison">
              {isLoading ? <div className="ss-skeleton" style={{ height: 12, width: "92%", borderRadius: 999 }} /> : <div className="ss-muted" style={{ fontSize: 13, lineHeight: 1.55 }}>{highlight1}</div>}
            </Card>
            <Card title="Highlight" caption="Category focus">
              {isLoading ? <div className="ss-skeleton" style={{ height: 12, width: "88%", borderRadius: 999 }} /> : <div className="ss-muted" style={{ fontSize: 13, lineHeight: 1.55 }}>{highlight2}</div>}
            </Card>
            <Card title="Highlight" caption="Merchant behavior">
              {isLoading ? <div className="ss-skeleton" style={{ height: 12, width: "84%", borderRadius: 999 }} /> : <div className="ss-muted" style={{ fontSize: 13, lineHeight: 1.55 }}>{highlight3}</div>}
            </Card>
          </div>

          <div className="ss-divider" />

          {/* Charts required by spec */}
          <div className="ss-grid ss-grid-2" aria-label="dashboard charts">
            <Card title="Spending trend" caption="Last 30 days">
              <AreaLineChart
                title="Spending trend (last 30 days)"
                data={metrics.spendTrend}
                isLoading={isLoading}
                emptyMessage="No spending trend data yet."
              />
            </Card>

            <Card title="Category breakdown" caption="Current month totals">
              <BarChart
                title="Category breakdown"
                data={metrics.categoryBreakdown}
                isLoading={isLoading}
                emptyMessage="No category totals yet."
              />
            </Card>
          </div>
        </>
      )}
    </main>
  );
}

