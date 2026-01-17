import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Chip, PageHeader } from "../components/ui";
import { EmptyState, FilterBar } from "../components/ux";
import { usePreferences } from "../state/preferences";
import { deriveAlerts, generateDemoTransactions } from "../mock/demoData";

const severityTone = {
  info: "primary",
  warning: "warn",
  error: "error",
  success: "success",
};

// PUBLIC_INTERFACE
export default function AlertsPage() {
  /** Alerts management: list, filters, and dismiss actions (demo-derived). This is the only page that manages alerts. */
  const { prefs } = usePreferences();

  // Simulated loading (bounded)
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setIsLoading(false), 420);
    return () => window.clearTimeout(t);
  }, []);

  const transactions = useMemo(() => {
    const demo = generateDemoTransactions({ seed: 42, count: 54, currency: prefs.currency });
    return prefs.demoMode ? demo : demo; // placeholder: when real data exists, use it here if demoMode=false
  }, [prefs.demoMode, prefs.currency]);

  const derived = useMemo(
    () => deriveAlerts(transactions, { monthlyBudget: prefs.monthlyBudget, alertsEnabled: prefs.alertsEnabled }),
    [transactions, prefs.monthlyBudget, prefs.alertsEnabled]
  );

  const [dismissed, setDismissed] = useState(() => new Set());
  const [severity, setSeverity] = useState("All");
  const [status, setStatus] = useState("All");

  const alerts = useMemo(() => {
    const filtered = derived
      .filter((a) => !dismissed.has(a.id))
      .filter((a) => (severity === "All" ? true : a.severity === severity))
      .filter((a) => (status === "All" ? true : a.status === status));
    return filtered;
  }, [derived, dismissed, severity, status]);

  const openCount = useMemo(
    () => derived.filter((a) => a.status === "open").filter((a) => !dismissed.has(a.id)).length,
    [derived, dismissed]
  );

  const dismiss = (id) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

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
          <option value="warning">warning</option>
          <option value="info">info</option>
        </select>
      </label>

      <label className="ss-muted" style={{ fontSize: 12 }}>
        Status
        <select className="ss-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter" style={{ minWidth: 160 }}>
          <option value="All">All</option>
          <option value="open">open</option>
          <option value="resolved">resolved</option>
        </select>
      </label>

      <Button variant="ghost" onClick={() => setStatus("open")} aria-label="Show open alerts">
        Open
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
        description="Review what needs attention and dismiss items you’ve already checked."
        right={<Chip tone={prefs.demoMode ? "secondary" : "primary"}>{prefs.demoMode ? "Demo mode" : "Live"}</Chip>}
      />

      <FilterBar
        title="Alert filters"
        onReset={resetFilters}
        left={<Chip tone={prefs.alertsEnabled ? "success" : "warn"}>{prefs.alertsEnabled ? `${openCount} open` : "Alerts off"}</Chip>}
        right={desktopRightControls}
      />

      <div style={{ height: 12 }} />

      <div className="ss-grid ss-grid-2" aria-label="alerts layout">
        <Card title="Alerts" caption="Dismiss items after reviewing">
          {isLoading ? (
            <div style={{ display: "grid", gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 16, border: "1px solid var(--ss-border)", background: "rgba(255,255,255,0.02)" }}>
                  <div className="ss-skeleton" style={{ height: 12, width: "78%", borderRadius: 999 }} />
                  <div style={{ height: 8 }} />
                  <div className="ss-skeleton" style={{ height: 12, width: "55%", borderRadius: 999 }} />
                </div>
              ))}
            </div>
          ) : !prefs.alertsEnabled ? (
            <EmptyState
              title="Alerts are turned off"
              description="Enable alerts in Settings if you want to see budget and anomaly notifications."
              primaryAction={{ label: "Go to settings", onClick: () => (window.location.href = "/settings"), variant: "primary" }}
              secondaryAction={{ label: "Reset filters", onClick: resetFilters, variant: "ghost" }}
            />
          ) : alerts.length === 0 ? (
            <EmptyState
              title="No alerts match these filters"
              description="Try changing severity/status filters, or reset to see all open items."
              primaryAction={{ label: "Reset filters", onClick: resetFilters, variant: "primary" }}
              secondaryAction={{ label: "Show all", onClick: () => { setSeverity("All"); setStatus("All"); }, variant: "ghost" }}
            />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {alerts.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: 12,
                    borderRadius: 16,
                    border: "1px solid var(--ss-border)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <strong style={{ fontSize: 13 }}>{a.title}</strong>
                        <Chip tone={severityTone[a.severity] || "primary"}>{a.severity}</Chip>
                        <Chip tone={a.status === "open" ? "warn" : "success"}>{a.status}</Chip>
                      </div>
                      <div className="ss-muted" style={{ fontSize: 12, marginTop: 6 }}>
                        {a.type} • {a.date}
                      </div>
                      <p className="ss-card-caption" style={{ margin: "8px 0 0 0" }}>
                        {a.description}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Button variant="ghost" onClick={() => dismiss(a.id)} aria-label={`Dismiss alert: ${a.title}`}>
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="About alerts" caption="How to use this page">
          <div className="ss-muted" style={{ fontSize: 13, lineHeight: 1.65 }}>
            <p style={{ marginTop: 0 }}>
              Alerts call out unusual activity (like large transactions) and budget pressure so you can act quickly.
            </p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Use filters to focus on what matters right now.</li>
              <li>Dismiss items after you’ve verified them.</li>
              <li>Enable/disable alerts from Settings.</li>
            </ul>
          </div>

          <div className="ss-divider" />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Chip tone="primary">Info</Chip>
            <Chip tone="warn">Warning</Chip>
            <Chip tone="error">Error</Chip>
          </div>
        </Card>
      </div>
    </main>
  );
}

