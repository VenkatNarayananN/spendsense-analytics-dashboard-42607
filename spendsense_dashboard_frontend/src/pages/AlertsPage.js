import React, { useMemo, useState } from "react";
import { Button, Card, Chip, PageHeader } from "../components/ui";
import { getAlertsMock } from "../mock/mockData";

const sevTone = {
  primary: "primary",
  secondary: "secondary",
  error: "error",
  success: "success",
};

// PUBLIC_INTERFACE
export default function AlertsPage() {
  /** Alert rules list + recent alerts (mock data) with toggles. */
  const initial = useMemo(() => getAlertsMock(), []);
  const [rules, setRules] = useState(initial.rules);

  const toggleRule = (id) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  return (
    <main role="main" aria-label="Alerts">
      <PageHeader
        title="Alerts"
        description="Configure alert rules and review recently triggered alerts. (Mock data)"
        right={<Chip tone="primary">{rules.filter((r) => r.enabled).length} enabled</Chip>}
      />

      <div className="ss-grid ss-grid-2" aria-label="alerts layout">
        <Card title="Alert Rules" caption="Toggle rules on/off">
          <div style={{ display: "grid", gap: 12 }}>
            {rules.map((r) => (
              <div
                key={r.id}
                className="ss-card"
                style={{
                  borderRadius: 16,
                  border: "1px solid var(--ss-border)",
                  background: "rgba(255,255,255,0.78)",
                }}
              >
                <div className="ss-card-pad" style={{ padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <strong style={{ fontSize: 13 }}>{r.name}</strong>
                        <Chip tone={sevTone[r.severity] || "primary"}>{r.severity.toUpperCase()}</Chip>
                        {r.enabled ? <Chip tone="success">Enabled</Chip> : <Chip tone="secondary">Disabled</Chip>}
                      </div>
                      <p className="ss-card-caption" style={{ margin: "6px 0 0 0" }}>
                        {r.description}
                      </p>
                    </div>

                    <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="ss-muted" style={{ fontSize: 12 }}>
                        {r.enabled ? "On" : "Off"}
                      </span>
                      <input
                        type="checkbox"
                        checked={r.enabled}
                        onChange={() => toggleRule(r.id)}
                        aria-label={`Toggle rule ${r.name}`}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent Alerts" caption="Triggered events (mock)">
          <div style={{ display: "grid", gap: 10 }}>
            {initial.recent.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: 12,
                  borderRadius: 16,
                  border: "1px solid var(--ss-border)",
                  background: "rgba(253,242,248,0.45)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ fontSize: 13 }}>{a.title}</strong>
                    <div className="ss-muted" style={{ fontSize: 12, marginTop: 4 }}>
                      {a.when}
                    </div>
                  </div>
                  <Chip tone={sevTone[a.severity] || "primary"}>{a.severity}</Chip>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => {}} aria-label="View all alerts (not implemented)">
              View all
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
