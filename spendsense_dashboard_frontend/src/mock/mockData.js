/**
 * Mock datasets for UI scaffolding. Replace with API calls later.
 */

function rand(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// PUBLIC_INTERFACE
export function getDashboardMock() {
  /** Returns dashboard summary + time series + category distribution. */
  const series = Array.from({ length: 14 }).map((_, i) => ({
    label: daysAgo(13 - i).slice(5),
    value: rand(35, 160) + (i % 4 === 0 ? rand(40, 90) : 0),
  }));

  const categories = [
    { label: "Food", value: 520 },
    { label: "Transport", value: 230 },
    { label: "Shopping", value: 410 },
    { label: "Utilities", value: 180 },
    { label: "Entertainment", value: 150 },
  ];

  const spendTotal = categories.reduce((a, c) => a + c.value, 0);
  const budget = 1800;
  const utilization = Math.round((spendTotal / budget) * 100);

  return {
    spendTotal,
    budget,
    utilization,
    topCategory: categories.slice().sort((a, b) => b.value - a.value)[0],
    spendSeries: series,
    categoryDistribution: categories,
  };
}

// PUBLIC_INTERFACE
export function getTransactionsMock() {
  /** Returns a list of transactions for table filters. */
  const merchants = ["Aurora Cafe", "Metro Transit", "Luna Market", "Rose Boutique", "Cloud Utilities", "Cinema House"];
  const categories = ["Food", "Transport", "Shopping", "Utilities", "Entertainment"];
  const status = ["Cleared", "Pending", "Flagged"];

  return Array.from({ length: 57 }).map((_, i) => {
    const cat = categories[i % categories.length];
    const s = status[i % status.length];
    const amt = rand(6, 210) * (cat === "Shopping" ? 1.6 : 1);

    return {
      id: `tx_${i + 1}`,
      date: daysAgo(i % 28),
      merchant: merchants[i % merchants.length],
      category: cat,
      amount: amt,
      status: s,
    };
  });
}

// PUBLIC_INTERFACE
export function getInsightsMock() {
  /** Returns insight cards and simple trends. */
  const insights = [
    { id: "i1", title: "Dining spend is up 18% this month", tone: "secondary", detail: "Your Food category increased compared to last month." },
    { id: "i2", title: "3 unusually high transactions detected", tone: "error", detail: "Two Shopping purchases and one Utilities bill exceeded your typical range." },
    { id: "i3", title: "Potential savings: switch subscriptions", tone: "success", detail: "You could save ~$24/mo by downgrading 2 subscriptions." },
  ];

  const trend = Array.from({ length: 6 }).map((_, i) => ({
    label: `M-${5 - i}`,
    value: rand(900, 1400) + (i === 5 ? 120 : 0),
  }));

  const savings = [
    { label: "Subscriptions", value: 42 },
    { label: "Fees", value: 18 },
    { label: "Dining", value: 27 },
    { label: "Transport", value: 12 },
  ];

  return { insights, spendTrend: trend, savingsByArea: savings };
}

// PUBLIC_INTERFACE
export function getAlertsMock() {
  /** Returns alert rules and recent triggered alerts. */
  const rules = [
    { id: "r1", name: "Large transaction > $150", enabled: true, severity: "error", description: "Notify when any single transaction exceeds $150." },
    { id: "r2", name: "Budget utilization > 80%", enabled: true, severity: "secondary", description: "Heads-up when you're nearing budget limits." },
    { id: "r3", name: "New merchant detected", enabled: false, severity: "primary", description: "Alert when spending at a merchant you haven't used before." },
  ];

  const recent = [
    { id: "a1", ruleId: "r1", title: "Large transaction at Rose Boutique", when: daysAgo(1), severity: "error" },
    { id: "a2", ruleId: "r2", title: "Budget utilization reached 82%", when: daysAgo(4), severity: "secondary" },
    { id: "a3", ruleId: "r3", title: "New merchant: Luna Market", when: daysAgo(8), severity: "primary" },
  ];

  return { rules, recent };
}
