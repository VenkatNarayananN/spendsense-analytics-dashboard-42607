/**
 * Production-like demo dataset generator.
 * Designed for a realistic SpendSense walk-through without backend dependencies.
 */

function mulberry32(seed) {
  // Deterministic RNG for stable demo.
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function isoDateDaysAgo(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function weekdayName(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function fmtMonthLabel(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short" });
}

const CATEGORY_ICON_HINT = {
  Groceries: "Food",
  Dining: "Food",
  Coffee: "Food",
  Transportation: "Transport",
  Gas: "Transport",
  Shopping: "Shopping",
  Utilities: "Utilities",
  Subscriptions: "Utilities",
  Entertainment: "Entertainment",
  Health: "Utilities",
};

const MERCHANTS = [
  { merchant: "Aurora Cafe", category: "Coffee", base: 6, spread: 9 },
  { merchant: "Luna Market", category: "Groceries", base: 24, spread: 55 },
  { merchant: "Metro Transit", category: "Transportation", base: 2.75, spread: 4.5 },
  { merchant: "Northside Gas", category: "Gas", base: 32, spread: 46 },
  { merchant: "Rose Boutique", category: "Shopping", base: 38, spread: 160 },
  { merchant: "Cloud Utilities", category: "Utilities", base: 85, spread: 55 },
  { merchant: "StreamFlix", category: "Subscriptions", base: 10.99, spread: 6 },
  { merchant: "GreenFit Gym", category: "Health", base: 44, spread: 22 },
  { merchant: "Cinema House", category: "Entertainment", base: 18, spread: 42 },
  { merchant: "Harbor Sushi", category: "Dining", base: 22, spread: 70 },
];

// PUBLIC_INTERFACE
export function generateDemoTransactions({ seed = 42, days = 60, count = 48, currency = "USD" } = {}) {
  /** Generate stable, realistic transactions for demo purposes. */
  const rng = mulberry32(seed);
  const tx = [];

  for (let i = 0; i < count; i += 1) {
    const m = pick(rng, MERCHANTS);
    const day = Math.floor(rng() * days);
    const date = isoDateDaysAgo(day);

    // Add some weekly patterns (more dining on weekends, etc.)
    const weekday = new Date(`${date}T00:00:00`).getDay(); // 0 Sun .. 6 Sat
    const weekendBoost = weekday === 0 || weekday === 6 ? 1.22 : 1;

    // Add occasional anomalies (rare spikes)
    const anomaly = rng() < 0.08 ? 1.9 : 1;

    const amount = round2((m.base + rng() * m.spread) * weekendBoost * anomaly);

    tx.push({
      id: `demo_tx_${i + 1}`,
      date,
      merchant: m.merchant,
      category: m.category,
      amount,
      currency,
    });
  }

  // Ensure sorted descending by date for typical UX.
  return tx.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function groupSum(items, keyFn, valueFn) {
  const m = new Map();
  items.forEach((it) => {
    const k = keyFn(it);
    const v = valueFn(it);
    m.set(k, (m.get(k) || 0) + v);
  });
  return m;
}

function sum(items, valueFn) {
  return items.reduce((acc, it) => acc + valueFn(it), 0);
}

// PUBLIC_INTERFACE
export function deriveDashboardMetrics(transactions, { monthlyBudget = 2200 } = {}) {
  /** Compute dashboard KPIs + chart datasets from transactions. */
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

  const inMonth = transactions.filter((t) => t.date >= monthStart && t.date <= today.toISOString().slice(0, 10));
  const totalSpend = sum(inMonth, (t) => t.amount);
  const uniqueDays = new Set(inMonth.map((t) => t.date)).size || 1;
  const avgDaily = totalSpend / uniqueDays;

  const byCategory = groupSum(inMonth, (t) => t.category, (t) => t.amount);
  const categoryBreakdown = Array.from(byCategory.entries())
    .map(([label, value]) => ({ label, value: round2(value) }))
    .sort((a, b) => b.value - a.value);

  const topCategory = categoryBreakdown[0] || { label: "—", value: 0 };

  // Last 30 days trend (daily totals)
  const trendDays = 30;
  const dailyMap = groupSum(transactions, (t) => t.date, (t) => t.amount);
  const trend = Array.from({ length: trendDays }).map((_, idx) => {
    const date = isoDateDaysAgo(trendDays - 1 - idx);
    return {
      label: date.slice(5),
      value: round2(dailyMap.get(date) || 0),
    };
  });

  const utilization = monthlyBudget > 0 ? Math.round((totalSpend / monthlyBudget) * 100) : 0;

  return {
    monthStart,
    totalSpend: round2(totalSpend),
    avgDaily: round2(avgDaily),
    topCategory,
    utilization,
    monthlyBudget,
    categoryBreakdown,
    spendTrend: trend,
  };
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((sorted.length - 1) * p);
  return sorted[idx];
}

// PUBLIC_INTERFACE
export function deriveInsights(transactions) {
  /**
   * Generate human-readable insight cards from transactions.
   * - category growth/decline (last 30 days vs previous 30 days)
   * - frequent merchants
   * - spending patterns by day of week
   */
  const last30Start = isoDateDaysAgo(29);
  const prev30Start = isoDateDaysAgo(59);
  const prev30End = isoDateDaysAgo(30);

  const last30 = transactions.filter((t) => t.date >= last30Start);
  const prev30 = transactions.filter((t) => t.date >= prev30Start && t.date <= prev30End);

  const lastByCat = groupSum(last30, (t) => t.category, (t) => t.amount);
  const prevByCat = groupSum(prev30, (t) => t.category, (t) => t.amount);

  const cats = new Set([...lastByCat.keys(), ...prevByCat.keys()]);
  const deltas = Array.from(cats).map((c) => {
    const last = lastByCat.get(c) || 0;
    const prev = prevByCat.get(c) || 0;
    const delta = prev === 0 ? (last > 0 ? 1 : 0) : (last - prev) / prev;
    return { category: c, last, prev, delta };
  });

  deltas.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const topMove = deltas[0];

  // Frequent merchants (by count)
  const countByMerchant = groupSum(last30, (t) => t.merchant, () => 1);
  const topMerchants = Array.from(countByMerchant.entries())
    .map(([merchant, count]) => ({ merchant, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Weekday pattern
  const byDay = groupSum(last30, (t) => weekdayName(t.date), (t) => t.amount);
  const dayArr = Array.from(byDay.entries()).map(([day, amt]) => ({ day, amt }));
  dayArr.sort((a, b) => b.amt - a.amt);
  const topDay = dayArr[0];

  const insights = [];

  if (topMove) {
    const pct = Math.round(Math.abs(topMove.delta) * 100);
    const dir = topMove.delta >= 0 ? "up" : "down";
    insights.push({
      id: "ins_cat_move",
      title: `${topMove.category} spending is ${dir} ${pct}% vs the previous month`,
      detail:
        topMove.prev === 0
          ? `You started spending in ${topMove.category} recently.`
          : `Last 30 days: ${round2(topMove.last)} • Previous 30 days: ${round2(topMove.prev)}.`,
      tone: topMove.delta >= 0 ? "secondary" : "success",
      kind: "Category change",
    });
  }

  if (topMerchants.length > 0) {
    const primary = topMerchants[0];
    insights.push({
      id: "ins_merchants",
      title: `You’re a regular at ${primary.merchant}`,
      detail: `It appears ${primary.merchant} is your most frequent merchant in the last 30 days (${primary.count} transactions).`,
      tone: "primary",
      kind: "Frequent merchants",
    });
  }

  if (topDay) {
    insights.push({
      id: "ins_weekday",
      title: `Most spending happens on ${topDay.day}s`,
      detail: `In the last 30 days, ${topDay.day} is your highest spend day. Consider moving non-urgent purchases to lower-spend days.`,
      tone: "success",
      kind: "Weekly pattern",
    });
  }

  return insights;
}

// PUBLIC_INTERFACE
export function deriveAlerts(transactions, { monthlyBudget = 2200, alertsEnabled = true } = {}) {
  /**
   * Create alerts (type/severity/date/status) from transaction data.
   * Also supports demo examples when data is sparse.
   */
  if (!alertsEnabled) return [];

  const today = new Date().toISOString().slice(0, 10);
  const last30Start = isoDateDaysAgo(29);
  const last30 = transactions.filter((t) => t.date >= last30Start);

  const amounts = last30.map((t) => t.amount);
  const highThreshold = Math.max(120, percentile(amounts, 0.92)); // dynamic but bounded

  const total30 = sum(last30, (t) => t.amount);
  const utilization = monthlyBudget > 0 ? Math.round((total30 / monthlyBudget) * 100) : 0;

  const alerts = [];

  // Budget utilization alert
  if (utilization >= 80) {
    alerts.push({
      id: "al_budget_80",
      type: "Budget",
      severity: utilization >= 95 ? "error" : "warning",
      date: today,
      status: "open",
      title: `Budget utilization is at ${utilization}%`,
      description: "You’re close to your monthly budget. Consider tightening discretionary categories this week.",
    });
  }

  // High transaction alerts (open)
  last30
    .filter((t) => t.amount >= highThreshold)
    .slice(0, 3)
    .forEach((t, idx) => {
      alerts.push({
        id: `al_high_${idx + 1}`,
        type: "Large transaction",
        severity: "error",
        date: t.date,
        status: "open",
        title: `Large transaction at ${t.merchant}`,
        description: `This ${t.category} purchase (${t.amount}) is higher than your typical transaction size.`,
        transactionId: t.id,
      });
    });

  // New merchant (informational): merchant in last 7 days not present in previous 30-60 days
  const last7Start = isoDateDaysAgo(6);
  const last7 = transactions.filter((t) => t.date >= last7Start);
  const earlier = transactions.filter((t) => t.date < last7Start && t.date >= isoDateDaysAgo(60));
  const earlierMerchants = new Set(earlier.map((t) => t.merchant));
  const newMerchantTx = last7.find((t) => !earlierMerchants.has(t.merchant));
  if (newMerchantTx) {
    alerts.push({
      id: "al_new_merchant",
      type: "New merchant",
      severity: "info",
      date: newMerchantTx.date,
      status: "open",
      title: `New merchant: ${newMerchantTx.merchant}`,
      description: "This merchant hasn’t appeared in your recent history. Double-check it looks familiar.",
      transactionId: newMerchantTx.id,
    });
  }

  // Ensure at least a couple of alerts exist for demo readiness
  if (alerts.length < 2) {
    alerts.push({
      id: "al_demo_1",
      type: "Heads-up",
      severity: "info",
      date: fmtFallbackDate(isoDateDaysAgo(3)),
      status: "open",
      title: "Spending is trending higher this week",
      description: "Your day-to-day spend is slightly above your usual pattern. Keep an eye on dining and shopping.",
    });
  }

  return alerts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function fmtFallbackDate(iso) {
  // keep as ISO; function exists for future formatting flexibility
  return iso;
}

// PUBLIC_INTERFACE
export function monthSpendComparison(transactions) {
  /** Simple highlight message comparing current month to previous month. */
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

  const thisMonth = transactions.filter((t) => t.date >= thisMonthStart);
  const prevMonth = transactions.filter((t) => t.date >= prevMonthStart && t.date <= prevMonthEnd);

  const a = sum(thisMonth, (t) => t.amount);
  const b = sum(prevMonth, (t) => t.amount);

  if (b <= 0 && a <= 0) return "No spending data yet — import or connect an account to get started.";
  if (b <= 0) return "This is your first month with data — keep going to unlock comparisons.";

  const diff = a - b;
  const pct = Math.round((Math.abs(diff) / b) * 100);
  if (Math.abs(diff) < 25) return "Spending is on track with last month.";
  return diff > 0
    ? `Spending increased about ${pct}% compared to last month.`
    : `Nice work — spending decreased about ${pct}% compared to last month.`;
}

// PUBLIC_INTERFACE
export function categoryHighlight(transactions) {
  /** Short plain-English highlight based on top category in the last 30 days. */
  const last30Start = isoDateDaysAgo(29);
  const last30 = transactions.filter((t) => t.date >= last30Start);
  const byCat = groupSum(last30, (t) => t.category, (t) => t.amount);
  if (byCat.size === 0) return "Once transactions are available, we’ll highlight your biggest categories here.";

  const top = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1])[0];
  const cat = top[0];
  const amt = round2(top[1]);

  const hint = CATEGORY_ICON_HINT[cat] || cat;
  return `Your biggest category lately is ${cat} (${amt}). Consider setting a small target for ${hint.toLowerCase()} spend next week.`;
}

// PUBLIC_INTERFACE
export function merchantHighlight(transactions) {
  /** Short highlight based on most frequent merchant last 30 days. */
  const last30Start = isoDateDaysAgo(29);
  const last30 = transactions.filter((t) => t.date >= last30Start);
  const byM = groupSum(last30, (t) => t.merchant, () => 1);
  if (byM.size === 0) return "We’ll identify your most frequent merchants once your transactions are in.";

  const top = Array.from(byM.entries()).sort((a, b) => b[1] - a[1])[0];
  return `Most frequent merchant: ${top[0]} (${top[1]} transactions in the last 30 days).`;
}

// PUBLIC_INTERFACE
export function monthLabelsForTrend(transactions) {
  /** Optional helper: month totals for last 3 months for alternative charting. */
  const monthsBack = 3;
  const totals = [];
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
    const total = transactions.filter((t) => t.date >= start && t.date <= end).reduce((a, t) => a + t.amount, 0);
    totals.push({ label: fmtMonthLabel(start), value: round2(total) });
  }
  return totals;
}

