import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Chip, PageHeader } from "../components/ui";
import { getAlertsMock } from "../mock/mockData";
import { EmptyState, FilterBar } from "../components/ux";

const sevTone = {
  primary: "primary",
  secondary: "warn",
  error: "error",
  success: "success",
};

function deriveStatus(rule) {
  // Mock status based on enabled flag; real app would come from API
  return rule.enabled ? "active" : "snoozed";
}

// PUBLIC_INTERFACE
export default function AlertsPage() {
  /** Alert rules list + recent alerts (mock data) with toggles and filters. */
  const initial = useMemo(() => getAlertsMock(), []);
  const [rules, setRules] = useState(initial.rules);

  // filters
  const [severity, setSeverity] = useState("All");
  const [status, setStatus] = useState("All");

  // Simulated loading
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setIsLoading(false), 420);
    return () => window.clearTimeout(t);
  }, []);

  const toggleRule = (id) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      if (severity !== "All" && r.severity !== severity) return false;
      const st = deriveStatus(r);
      if (status !== "All" && st !== status) return false;
      return true;
    });
  }, [rules, severity, status]);

  const enabledCount = useMemo(() => rules.filter((r) => r.enabled).length, [rules]);

  const resetFilters = () => {
    setSeverity("All");
    setStatus("All");
  };

  const desktopRightControls = (
    <>
      <label className="ss-muted" style={{ fontSize: 12 }}>
        Severity
        <select className="ss-select" value={severity} onChange={(e) => setSeverity(e.target.value)} aria-label="Severity filter" style={{ minWidth: 160 }}>
          <option value="All">All</option>
          <option value="error">error</option>
          <option value="secondary">warning</option>
          <option value="primary">info</option>
        </select>
      </label>
      <label className="ss-muted" style={{ fontSize: 12 }}>
        Status
        <select className="ss-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter" style={{ minWidth: 160 }}>
          <option value="All">All</option>
          <option value="active">active</option>
          <option value="snoozed">snoozed</option>
          <option value="resolved">resolved</option>
        </select>
      </label>

      {/* Quick toggles */}
      <Button variant="ghost" onClick={() => setStatus("active")} aria-label="Show active alerts">
        Active
      </Button>
      <Button variant="ghost" onClick={() => setStatus("snoozed")} aria-label="Show snoozed alerts">
        Snoozed
      </Button>
      <Button variant="ghost" onClick={() => setStatus("resolved")} aria-label="Show resolved alerts">
        Resolved
      </Button>
    </>
  );

  return (
    <main role="main" aria-label="Alerts">
      <PageHeader
        title="Alerts"
        description="Configure alert rules and review recently triggered alerts. (Mock data)"
        right={<Chip tone="primary">{enabledCount} enabled</Chip>}
      />

      <FilterBar title="Alert filters" onReset={resetFilters} left={<Chip tone="secondary">Filters</Chip>} right={desktopRightControls} />

      <div style={{ height: 12 }} />

      <div className="ss-grid ss-grid-2" aria-label="alerts layout">
        <Card title="Alert Rules" caption="Toggle rules on/off">
          {isLoading ? (
            <div style={{ display: "grid", gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="ss-card" style={{ borderRadius: 16, border: "1px solid var(--ss-border)", background: "rgba(255,255,255,0.02)" }}>
                  <div className="ss-card-pad" style={{ padding: 14 }}>
                    <div className="ss-skeleton" style={{ height: 12, width: "60%", borderRadius: 999 }} />
                    <div style={{ height: 10 }} />
                    <div className="ss-skeleton" style={{ height: 12, width: "82%", borderRadius: 999 }} />
                    <div style={{ height: 12 }} />
                    <div style={{ display: "flex", gap: 10 }}>
                      <div className="ss-skeleton" style={{ height: 22, width: 80, borderRadius: 999 }} />
                      <div className="ss-skeleton" style={{ height: 22, width: 72, borderRadius: 999 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRules.length === 0 ? (
            <EmptyState
              title="No rules match these filters"
              description="Try changing severity/status. You can also create a new rule to start monitoring."
              primaryAction={{ label: "Create a rule", onClick: () => {}, variant: "primary" }}
              secondaryAction={{ label: "Reset filters", onClick: resetFilters, variant: "ghost" }}
            />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredRules.map((r) => (
                <div
                  key={r.id}
                  className="ss-card"
                  style={{
                    borderRadius: 16,
                    border: "1px solid var(--ss-border)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="ss-card-pad" style={{ padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <strong style={{ fontSize: 13 }}>{r.name}</strong>
                          <Chip tone={sevTone[r.severity] || "primary"}>{r.severity.toUpperCase()}</Chip>
                          {r.enabled ? <Chip tone="success">Active</Chip> : <Chip tone="secondary">Snoozed</Chip>}
                        </div>
                        <p className="ss-card-caption" style={{ margin: "6px 0 0 0" }}>
                          {r.description}
                        </p>
                      </div>

                      <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="ss-muted" style={{ fontSize: 12 }}>
                          {r.enabled ? "On" : "Off"}
                        </span>
                        <input type="checkbox" checked={r.enabled} onChange={() => toggleRule(r.id)} aria-label={`Toggle rule ${r.name}`} />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Recent Alerts" caption="Triggered events (mock)">
          {isLoading ? (
            <div style={{ display: "grid", gap: 10 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 16, border: "1px solid var(--ss-border)", background: "rgba(255,255,255,0.02)" }}>
                  <div className="ss-skeleton" style={{ height: 12, width: "78%", borderRadius: 999 }} />
                  <div style={{ height: 8 }} />
                  <div className="ss-skeleton" style={{ height: 12, width: "40%", borderRadius: 999 }} />
                </div>
              ))}
            </div>
          ) : initial.recent.length === 0 ? (
            <EmptyState
              title="No alerts yet"
              description="Create a rule to start receiving alerts when something important happens."
              primaryAction={{ label: "Create a rule", onClick: () => {}, variant: "primary" }}
              secondaryAction={{ label: "Learn more", onClick: () => {}, variant: "ghost" }}
            />
          ) : (
            <>
              <div style={{ display: "grid", gap: 10 }}>
                {initial.recent.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: 12,
                      borderRadius: 16,
                      border: "1px solid var(--ss-border)",
                      background: "rgba(255,255,255,0.02)",
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
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
