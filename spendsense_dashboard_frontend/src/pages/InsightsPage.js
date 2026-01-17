import React, { useMemo } from "react";
import { Card, Chip, PageHeader } from "../components/ui";
import { AreaLineChart, BarChart } from "../components/charts";
import { getInsightsMock } from "../mock/mockData";

const toneLabel = {
  primary: "Info",
  secondary: "Heads-up",
  success: "Opportunity",
  error: "Anomaly",
};

// PUBLIC_INTERFACE
export default function InsightsPage() {
  /** Insights cards and trend visuals (mock data). */
  const data = useMemo(() => getInsightsMock(), []);

  return (
    <main role="main" aria-label="Insights">
      <PageHeader
        title="Insights"
        description="Actionable insights from your spending patterns — anomalies, trends, and savings opportunities."
        right={<Chip tone="secondary">{data.insights.length} insights</Chip>}
      />

      <div className="ss-grid ss-grid-3" aria-label="insights list">
        {data.insights.map((i) => (
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

      <div className="ss-divider" />

      <div className="ss-grid ss-grid-2" aria-label="insights charts">
        <Card title="Monthly Spend Trend" caption="6-point trend (mock)">
          <AreaLineChart title="Monthly spend trend" data={data.spendTrend} />
        </Card>

        <Card title="Potential Savings Breakdown" caption="Estimated monthly savings areas (mock)">
          <BarChart title="Savings breakdown" data={data.savingsByArea} />
        </Card>
      </div>
    </main>
  );
}
