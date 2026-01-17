/**
 * Legacy mock datasets for UI scaffolding.
 *
 * This file is kept for backward compatibility with earlier scaffolding, but current pages use
 * `src/mock/demoData.js` which provides more realistic demo data and derived insights/alerts.
 */

import {
  deriveAlerts,
  deriveDashboardMetrics,
  deriveInsights,
  generateDemoTransactions,
  monthLabelsForTrend,
} from "./demoData";

// PUBLIC_INTERFACE
export function getDashboardMock() {
  /** Back-compat: derive dashboard metrics from generated demo transactions. */
  const tx = generateDemoTransactions({ seed: 42, count: 54, currency: "USD" });
  const metrics = deriveDashboardMetrics(tx, { monthlyBudget: 2200 });
  return {
    spendTotal: metrics.totalSpend,
    budget: metrics.monthlyBudget,
    utilization: metrics.utilization,
    topCategory: metrics.topCategory,
    spendSeries: metrics.spendTrend,
    categoryDistribution: metrics.categoryBreakdown,
  };
}

// PUBLIC_INTERFACE
export function getTransactionsMock() {
  /** Back-compat: return demo transactions. */
  return generateDemoTransactions({ seed: 42, count: 54, currency: "USD" });
}

// PUBLIC_INTERFACE
export function getInsightsMock() {
  /** Back-compat: return derived insights and simple trends. */
  const tx = generateDemoTransactions({ seed: 42, count: 54, currency: "USD" });
  const insights = deriveInsights(tx);
  const metrics = deriveDashboardMetrics(tx, { monthlyBudget: 2200 });
  const spendTrend = monthLabelsForTrend(tx);
  const savingsByArea = (metrics.categoryBreakdown || []).slice(0, 4).map((c) => ({ label: c.label, value: Math.round(c.value * 0.06) }));
  return { insights, spendTrend, savingsByArea };
}

// PUBLIC_INTERFACE
export function getAlertsMock() {
  /** Back-compat: return derived alerts and a basic empty "rules" placeholder (rules UI was removed). */
  const tx = generateDemoTransactions({ seed: 42, count: 54, currency: "USD" });
  const recent = deriveAlerts(tx, { monthlyBudget: 2200, alertsEnabled: true }).map((a) => ({
    id: a.id,
    ruleId: a.type,
    title: a.title,
    when: a.date,
    severity: a.severity === "info" ? "primary" : a.severity === "warning" ? "secondary" : "error",
  }));
  return { rules: [], recent };
}

