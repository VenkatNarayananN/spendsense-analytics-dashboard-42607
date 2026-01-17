import React from "react";
import { Card, Chip, PageHeader } from "../components/ui";
import { BarChartPlaceholder, LineChartPlaceholder } from "../components/chartPlaceholders";

// PUBLIC_INTERFACE
export default function ProtectedExamplePage() {
  /** Example route protected by ProtectedRoute; demonstrates placeholder charts and future auth-gated content. */
  return (
    <main role="main" aria-label="Protected example">
      <PageHeader
        title="Protected"
        description="This page is behind ProtectedRoute (simulated auth). Use Login/Logout in the top bar to toggle access."
        right={<Chip tone="secondary">Scaffold</Chip>}
      />

      <div className="ss-grid ss-grid-2" aria-label="protected charts grid">
        <Card title="Line Chart Placeholder" caption="Skeleton/empty state now; accepts props for future data">
          <LineChartPlaceholder title="Spend forecast (placeholder)" loading={true} data={[]} />
        </Card>

        <Card title="Bar Chart Placeholder" caption="Skeleton/empty state now; accepts props for future data">
          <BarChartPlaceholder title="Category forecast (placeholder)" loading={false} data={[]} />
        </Card>
      </div>

      <div className="ss-divider" />

      <Card title="Notes" caption="What will go here later">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
            Replace placeholders with real charts once an analytics API is connected.
          </li>
          <li className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
            Replace simulated auth with Supabase or backend sessions.
          </li>
        </ul>
      </Card>
    </main>
  );
}

