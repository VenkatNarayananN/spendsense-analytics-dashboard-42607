import React, { useMemo } from "react";
import { Card, Chip, PageHeader } from "../components/ui";
import { AreaLineChart, BarChart } from "../components/charts";
import { getDashboardMock } from "../mock/mockData";

function fmtCurrency(n) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

// PUBLIC_INTERFACE
export default function DashboardPage() {
  /** Dashboard with summary cards and charts using mock data. */
  const data = useMemo(() => getDashboardMock(), []);

  return (
    <main role="main" aria-label="Dashboard">
      <PageHeader
        title="Dashboard"
        description="A quick, elegant overview of your spend, budget utilization, and category distribution."
        right={<Chip tone="primary">Elegant Rose Gold</Chip>}
      />

      <div className="ss-grid ss-grid-3" aria-label="summary cards">
        <Card title="Spend Total" caption="Last 30 days (mock)">
          <div className="ss-kpi">
            <strong>{fmtCurrency(data.spendTotal)}</strong>
            <span className="ss-muted">across {data.categoryDistribution.length} categories</span>
          </div>
        </Card>

        <Card
          title="Budget Utilization"
          caption={`Budget: ${fmtCurrency(data.budget)} (mock)`}
          right={<Chip tone={data.utilization >= 85 ? "error" : data.utilization >= 70 ? "secondary" : "success"}>{data.utilization}%</Chip>}
        >
          <div style={{ marginTop: 14 }}>
            <div
              aria-label="Budget utilization bar"
              style={{
                height: 12,
                borderRadius: 999,
                background: "rgba(55,65,81,0.10)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, data.utilization)}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #F472B6, #F59E0B)",
                }}
              />
            </div>
            <p className="ss-card-caption" style={{ marginTop: 10 }}>
              Keep utilization under <strong>80%</strong> for more flexibility.
            </p>
          </div>
        </Card>

        <Card title="Top Category" caption="Highest contribution (mock)" right={<Chip tone="secondary">{data.topCategory.label}</Chip>}>
          <div className="ss-kpi">
            <strong>{fmtCurrency(data.topCategory.value)}</strong>
            <span className="ss-muted">this period</span>
          </div>
        </Card>
      </div>

      <div className="ss-divider" />

      <div className="ss-grid ss-grid-2" aria-label="dashboard charts">
        <Card title="Spend Over Time" caption="14-day trend (mock)">
          <AreaLineChart title="Spend over time" data={data.spendSeries} />
        </Card>

        <Card title="Category Distribution" caption="Total spend by category (mock)">
          <BarChart title="Category distribution" data={data.categoryDistribution} />
        </Card>
      </div>
    </main>
  );
}
