import React, { useEffect, useMemo, useState } from "react";
import { Card, Chip, LiveBadge, PageHeader } from "../components/ui";
import { AreaLineChart, BarChart } from "../components/charts";
import { EmptyState, FilterBar } from "../components/ux";
import { usePreferences } from "../state/preferences";
import { useAppData } from "../state/appData";
import { categoryHighlight, deriveDashboardMetrics, merchantHighlight, monthSpendComparison } from "../mock/demoData";
import { fetchLatestFxRates, convertAmount, convertSeries } from "../lib/fxClient";

function fmtCurrency(n, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    const sym = currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "INR" ? "₹" : "$";
    return `${sym}${Number(n || 0).toFixed(2)}`;
  }
}

// PUBLIC_INTERFACE
export default function DashboardPage() {
  /** Dashboard: realistic KPIs, category breakdown, spending trend, and plain-English highlights. */
  const { prefs, setPrefs } = usePreferences();
  const { transactions: ctxTransactions, alerts: ctxAlerts, loadingData, dataError, seedingState, realtimeStatus, refreshAll } = useAppData();

  const supportedDashboardCurrencies = useMemo(() => ["USD", "INR", "GBP", "EUR"], []);
  const selectedCurrency = supportedDashboardCurrencies.includes(prefs.currency) ? prefs.currency : "USD";

  const [fxState, setFxState] = useState(() => ({
    status: "idle", // idle|loading|ready|error
    base: "USD",
    rates: null,
    timestamp: "",
    error: "",
  }));

  useEffect(() => {
    // Only fetch FX when user switches away from USD (or when they choose USD we can reset).
    let cancelled = false;

    async function run() {
      if (selectedCurrency === "USD") {
        setFxState({ status: "idle", base: "USD", rates: null, timestamp: "", error: "" });
        return;
      }

      setFxState((p) => ({ ...p, status: "loading", error: "" }));
      try {
        // Our backend supports base=USD (free plan), and computes cross-rates for other bases.
        const payload = await fetchLatestFxRates({ base: "USD" });
        if (cancelled) return;

        setFxState({
          status: "ready",
          base: payload.base,
          rates: payload.rates,
          timestamp: payload.timestamp,
          error: "",
        });
      } catch (err) {
        if (cancelled) return;
        setFxState({
          status: "error",
          base: "USD",
          rates: null,
          timestamp: "",
          error: err?.message || "FX rates could not be loaded.",
        });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedCurrency]);

  // Keep existing page-level skeleton behavior but also respect shared data loading state.
  const [pageWarmup, setPageWarmup] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setPageWarmup(false), 420);
    return () => window.clearTimeout(t);
  }, []);
  const isLoading = Boolean(pageWarmup || loadingData);

  const transactions = useMemo(() => (Array.isArray(ctxTransactions) ? ctxTransactions : []), [ctxTransactions]);

  const metrics = useMemo(() => deriveDashboardMetrics(transactions, { monthlyBudget: prefs.monthlyBudget }), [transactions, prefs.monthlyBudget]);

  const canConvert = selectedCurrency === "USD" || fxState.status === "ready";
  const fxRates = fxState.rates;
  const fxBase = fxState.base || "USD";
  const fxMultiplierInfo = useMemo(() => {
    if (selectedCurrency === "USD") return { ok: true, note: "" };
    if (fxState.status === "loading") return { ok: false, note: "Loading FX rates…" };
    if (fxState.status === "error") return { ok: false, note: "FX unavailable — showing USD values." };
    return { ok: true, note: fxState.timestamp ? `Rates updated ${new Date(fxState.timestamp).toLocaleString()}` : "" };
  }, [fxState.status, fxState.timestamp, selectedCurrency]);

  const display = useMemo(() => {
    const currency = selectedCurrency;
    if (currency === "USD") {
      return {
        currency,
        totalSpend: metrics.totalSpend,
        avgDaily: metrics.avgDaily,
        topCategory: metrics.topCategory,
        monthlyBudget: prefs.monthlyBudget,
        spendTrend: metrics.spendTrend,
        categoryBreakdown: metrics.categoryBreakdown,
      };
    }

    if (fxState.status !== "ready" || !fxRates) {
      // Graceful fallback: keep USD numbers if we cannot convert.
      return {
        currency: "USD",
        totalSpend: metrics.totalSpend,
        avgDaily: metrics.avgDaily,
        topCategory: metrics.topCategory,
        monthlyBudget: prefs.monthlyBudget,
        spendTrend: metrics.spendTrend,
        categoryBreakdown: metrics.categoryBreakdown,
      };
    }

    return {
      currency,
      totalSpend: convertAmount(metrics.totalSpend, currency, fxRates, fxBase),
      avgDaily: convertAmount(metrics.avgDaily, currency, fxRates, fxBase),
      topCategory: {
        ...metrics.topCategory,
        value: convertAmount(metrics.topCategory.value, currency, fxRates, fxBase),
      },
      monthlyBudget: convertAmount(prefs.monthlyBudget, currency, fxRates, fxBase),
      spendTrend: convertSeries(metrics.spendTrend, currency, fxRates, fxBase),
      categoryBreakdown: convertSeries(metrics.categoryBreakdown, currency, fxRates, fxBase),
    };
  }, [fxBase, fxRates, fxState.status, metrics, prefs.monthlyBudget, selectedCurrency]);

  const alerts = useMemo(() => (Array.isArray(ctxAlerts) ? ctxAlerts : []), [ctxAlerts]);

  const highlight1 = useMemo(() => monthSpendComparison(transactions), [transactions]);
  const highlight2 = useMemo(() => categoryHighlight(transactions), [transactions]);
  const highlight3 = useMemo(() => merchantHighlight(transactions), [transactions]);

  const hasAnyData = transactions.length > 0;

  return (
    <main role="main" aria-label="Dashboard">
      <PageHeader
        title="Dashboard"
        description="A quick overview of this month’s spending, budget health, and category mix."
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <label className="ss-muted" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span>Currency</span>
              <select
                value={selectedCurrency}
                onChange={(e) => {
                  const next = String(e.target.value || "USD").toUpperCase();
                  setPrefs((p) => ({ ...p, currency: next }));
                }}
                aria-label="Select dashboard currency"
                className="ss-input"
                style={{
                  height: 36,
                  borderRadius: 12,
                  padding: "0 10px",
                  background: "var(--ss-surface, #fff)",
                }}
              >
                {supportedDashboardCurrencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            {selectedCurrency !== "USD" ? (
              <Chip tone={fxState.status === "error" ? "warn" : fxState.status === "loading" ? "secondary" : "success"} title={fxState.error || ""}>
                {fxMultiplierInfo.note || (canConvert ? "FX ready" : "FX")}
              </Chip>
            ) : null}

            {!prefs.demoMode ? <LiveBadge status={realtimeStatus?.transactions} label="Live" /> : null}
          </div>
        }
      />

      <FilterBar
        title="Dashboard context"
        left={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Chip tone="primary">Current month</Chip>
            <Chip tone="secondary">{selectedCurrency}</Chip>
            <Chip tone={prefs.alertsEnabled ? "success" : "warn"}>{prefs.alertsEnabled ? "Alerts on" : "Alerts off"}</Chip>
            {selectedCurrency !== "USD" && fxState.status === "error" ? (
              <span className="ss-muted" style={{ fontSize: 12 }}>
                FX service is unavailable right now — values shown in USD.
              </span>
            ) : null}
          </div>
        }
        right={<div className="ss-muted" style={{ fontSize: 12 }}>KPIs reflect the current calendar month</div>}
      />

      <div style={{ height: 12 }} />

      {!isLoading && (seedingState?.status === "failed" || dataError) ? (
        <div className="ss-card" role="status" aria-label="Data status message">
          <div className="ss-card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              <strong style={{ color: "var(--ss-text-primary)" }}>Notice:</strong>{" "}
              {seedingState?.status === "failed" ? seedingState.message : dataError}
            </div>
            <Chip tone="secondary" style={{ whiteSpace: "nowrap" }}>
              You can keep browsing
            </Chip>
            <button type="button" className="ss-btn ss-btn-ghost" onClick={() => refreshAll()} aria-label="Retry loading data">
              Retry
            </button>
          </div>
        </div>
      ) : null}

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
                  <strong>{fmtCurrency(display.totalSpend, display.currency)}</strong>
                  <span className="ss-muted">budget {fmtCurrency(display.monthlyBudget, display.currency)}</span>
                </div>
              )}
            </Card>

            <Card title="Avg daily spend" caption="Based on days with activity">
              {isLoading ? (
                <div className="ss-skeleton" style={{ height: 28, width: 160, borderRadius: 12 }} />
              ) : (
                <div className="ss-kpi">
                  <strong>{fmtCurrency(display.avgDaily, display.currency)}</strong>
                  <span className="ss-muted">per active day</span>
                </div>
              )}
            </Card>

            <Card title="Top category" caption="Current month" right={isLoading ? null : <Chip tone="secondary">{display.topCategory.label}</Chip>}>
              {isLoading ? (
                <div className="ss-skeleton" style={{ height: 28, width: 140, borderRadius: 12 }} />
              ) : (
                <div className="ss-kpi">
                  <strong>{fmtCurrency(display.topCategory.value, display.currency)}</strong>
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
                  <Chip
                    tone={
                      (display.monthlyBudget > 0 ? Math.round((display.totalSpend / display.monthlyBudget) * 100) : 0) >= 90
                        ? "error"
                        : (display.monthlyBudget > 0 ? Math.round((display.totalSpend / display.monthlyBudget) * 100) : 0) >= 80
                          ? "warn"
                          : "success"
                    }
                  >
                    {Math.max(0, display.monthlyBudget > 0 ? Math.round((display.totalSpend / display.monthlyBudget) * 100) : 0)}%
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
                    background: "color-mix(in srgb, var(--ss-border-color) 35%, transparent)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: isLoading
                        ? "40%"
                        : `${Math.min(
                            100,
                            Math.max(0, display.monthlyBudget > 0 ? Math.round((display.totalSpend / display.monthlyBudget) * 100) : 0)
                          )}%`,
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
                data={display.spendTrend}
                isLoading={isLoading}
                emptyMessage="No spending trend data yet."
                currency={display.currency}
              />
            </Card>

            <Card title="Category breakdown" caption="Current month totals">
              <BarChart
                title="Category breakdown"
                data={display.categoryBreakdown}
                isLoading={isLoading}
                emptyMessage="No category totals yet."
                currency={display.currency}
              />
            </Card>
          </div>
        </>
      )}
    </main>
  );
}

