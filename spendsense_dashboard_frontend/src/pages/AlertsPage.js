import React, { useMemo, useState } from "react";
import { Button, Chip, LiveBadge, PageHeader } from "../components/ui";
import { EmptyState } from "../components/ux";
import { usePreferences } from "../state/preferences";
import { useAppData } from "../state/appData";

const severityTone = {
  info: "primary",
  warning: "warn",
  error: "error",
  success: "success",
};

function toLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatUiDate(dateStr) {
  // For this UI, we keep a simple YYYY-MM-DD display consistent with existing data.
  const s = String(dateStr || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.length >= 10) return s.slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

// PUBLIC_INTERFACE
export default function AlertsPage() {
  /** Alerts management: list, filters, create (live) and dismiss actions. */
  const { prefs } = usePreferences();
  const {
    alerts: ctxAlerts,
    loadingData,
    dataError,
    seedingState,
    realtimeStatus,
    refreshAlerts,
    dismissAlert,
    createAlert,
  } = useAppData();

  const isLoading = Boolean(loadingData);

  const derived = useMemo(() => (Array.isArray(ctxAlerts) ? ctxAlerts : []), [ctxAlerts]);

  const [dismissed, setDismissed] = useState(() => new Set());
  const [severity, setSeverity] = useState("All");
  const [status, setStatus] = useState("All");

  const [newAlertOpen, setNewAlertOpen] = useState(false);
  const [newAlertType, setNewAlertType] = useState("info");
  const [newAlertTitle, setNewAlertTitle] = useState("");
  const [newAlertMessage, setNewAlertMessage] = useState("");
  const [newAlertSeverity, setNewAlertSeverity] = useState("info");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

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

  const dismiss = async (id) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    const res = await dismissAlert(id);
    if (!res?.ok) {
      // eslint-disable-next-line no-console
      console.warn("[alerts] Failed to dismiss alert in DB (non-fatal):", res?.error?.message || res?.error);
    }
  };

  const resetFilters = () => {
    setSeverity("All");
    setStatus("All");
  };

  const canOpenNewAlert = !prefs.demoMode;
  const openNewAlert = () => {
    setCreateError("");
    setNewAlertType("info");
    setNewAlertTitle("");
    setNewAlertMessage("");
    setNewAlertSeverity("info");
    setNewAlertOpen(true);
  };

  const closeNewAlert = () => {
    if (creating) return;
    setNewAlertOpen(false);
  };

  const submitNewAlert = async (e) => {
    e.preventDefault();
    setCreateError("");

    if (!newAlertMessage.trim()) {
      setCreateError("Please enter a message.");
      return;
    }
    if (!newAlertType.trim()) {
      setCreateError("Please select a type.");
      return;
    }

    setCreating(true);
    try {
      const res = await createAlert({
        type: newAlertType,
        title: newAlertTitle.trim() || undefined,
        message: newAlertMessage.trim(),
        severity: newAlertSeverity,
      });

      if (!res?.ok) {
        setCreateError(res?.error?.message || "Failed to create alert.");
        return;
      }

      // Close immediately; the list is already updated optimistically in context.
      setNewAlertOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const topRight = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <Chip tone={prefs.demoMode ? "secondary" : "primary"}>{prefs.demoMode ? "Demo mode" : "Live"}</Chip>
      {!prefs.demoMode ? <LiveBadge status={realtimeStatus?.alerts} label="Live" /> : null}
      <Button variant="primary" onClick={openNewAlert} disabled={!canOpenNewAlert} aria-label="New Alert">
        New Alert
      </Button>
    </div>
  );

  return (
    <main role="main" aria-label="Alerts">
      <PageHeader
        title="Alerts"
        description="Review what needs attention and dismiss items you’ve already checked."
        right={topRight}
      />

      {/* Inline filters bar (matches compact reference layout) */}
      <div
        className="ss-card"
        style={{
          borderRadius: 18,
          background: "color-mix(in srgb, var(--ss-card-bg) 70%, transparent)",
        }}
        aria-label="Alert filters"
      >
        <div className="ss-card-pad" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div className="ss-muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.2 }}>
                Filters
              </div>
              <Chip tone={prefs.alertsEnabled ? "success" : "warn"}>
                {prefs.alertsEnabled ? `${openCount} open` : "Alerts off"}
              </Chip>
              {severity !== "All" || status !== "All" ? (
                <Button variant="ghost" onClick={resetFilters} aria-label="Reset filters">
                  Reset
                </Button>
              ) : null}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <label className="ss-muted" style={{ fontSize: 12 }}>
                Severity
                <select
                  className="ss-select"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  aria-label="Severity filter"
                  style={{ minWidth: 160 }}
                >
                  <option value="All">All</option>
                  <option value="error">error</option>
                  <option value="warning">warning</option>
                  <option value="info">info</option>
                  <option value="success">success</option>
                </select>
              </label>

              <label className="ss-muted" style={{ fontSize: 12 }}>
                Status
                <select
                  className="ss-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  aria-label="Status filter"
                  style={{ minWidth: 160 }}
                >
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
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 12 }} />

      {seedingState?.status === "failed" || dataError ? (
        <div className="ss-card" role="status" aria-label="Data status message">
          <div className="ss-card-pad">
            <div className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              <strong style={{ color: "var(--ss-text-primary)" }}>Notice:</strong>{" "}
              {seedingState?.status === "failed" ? seedingState.message : dataError}
              <div style={{ height: 8 }} />
              <Button variant="ghost" onClick={() => refreshAlerts()} aria-label="Retry loading alerts">
                Retry
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Single-column list (matches reference) */}
      <section className="ss-card" aria-label="Alerts list">
        <div className="ss-card-pad" style={{ paddingTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h3 className="ss-card-title">Alerts</h3>
              <p className="ss-card-caption">Dismiss items after reviewing</p>
            </div>
          </div>

          <div style={{ height: 10 }} />

          {isLoading ? (
            <div style={{ display: "grid", gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid var(--ss-border-color)",
                    background: "color-mix(in srgb, var(--ss-card-bg) 45%, transparent)",
                  }}
                >
                  <div className="ss-skeleton" style={{ height: 12, width: "60%", borderRadius: 999 }} />
                  <div style={{ height: 8 }} />
                  <div className="ss-skeleton" style={{ height: 12, width: "35%", borderRadius: 999 }} />
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
              secondaryAction={{
                label: "Show all",
                onClick: () => {
                  setSeverity("All");
                  setStatus("All");
                },
                variant: "ghost",
              }}
            />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {alerts.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "start",
                    gap: 12,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid var(--ss-border-color)",
                    background: "color-mix(in srgb, var(--ss-card-bg) 45%, transparent)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 13, lineHeight: 1.2 }}>{a.title}</strong>
                      <Chip tone={severityTone[a.severity] || "primary"}>{toLabel(a.severity)}</Chip>
                      <Chip tone={a.status === "open" ? "warn" : "success"}>{toLabel(a.status)}</Chip>
                    </div>
                    <div className="ss-muted" style={{ fontSize: 12, marginTop: 6 }}>
                      {toLabel(a.type)} • {formatUiDate(a.date)}
                    </div>
                    <p className="ss-card-caption" style={{ margin: "8px 0 0 0" }}>
                      {a.description}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <Button variant="ghost" onClick={() => dismiss(a.id)} aria-label={`Dismiss alert: ${a.title}`}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {newAlertOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="New alert modal"
          onMouseDown={(e) => {
            // Click outside closes (but do not close during submit)
            if (e.target === e.currentTarget) closeNewAlert();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17, 24, 39, 0.55)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            className="ss-card"
            style={{
              width: "min(640px, 100%)",
              borderRadius: 20,
              boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
            }}
          >
            <div className="ss-card-pad">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <h3 className="ss-card-title">New Alert</h3>
                  <p className="ss-card-caption">Create an alert and save it to Supabase (Live mode).</p>
                </div>
                <Button variant="ghost" onClick={closeNewAlert} disabled={creating} aria-label="Close new alert modal">
                  Close
                </Button>
              </div>

              {!canOpenNewAlert ? (
                <div className="ss-muted" style={{ fontSize: 13, marginTop: 10, lineHeight: 1.6 }}>
                  Creating alerts is disabled in Demo mode. Sign in / enable Supabase to use this feature.
                </div>
              ) : (
                <form onSubmit={submitNewAlert} style={{ marginTop: 12, display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label className="ss-muted" style={{ fontSize: 12 }}>
                      Type
                      <select
                        className="ss-select"
                        value={newAlertType}
                        onChange={(e) => setNewAlertType(e.target.value)}
                        aria-label="Alert type"
                      >
                        <option value="info">info</option>
                        <option value="budget">budget</option>
                        <option value="anomaly">anomaly</option>
                        <option value="payment">payment</option>
                        <option value="security">security</option>
                      </select>
                    </label>

                    <label className="ss-muted" style={{ fontSize: 12 }}>
                      Severity
                      <select
                        className="ss-select"
                        value={newAlertSeverity}
                        onChange={(e) => setNewAlertSeverity(e.target.value)}
                        aria-label="Alert severity"
                      >
                        <option value="info">info</option>
                        <option value="warning">warning</option>
                        <option value="error">error</option>
                        <option value="success">success</option>
                      </select>
                    </label>
                  </div>

                  <label className="ss-muted" style={{ fontSize: 12 }}>
                    Title (optional)
                    <input
                      className="ss-input"
                      value={newAlertTitle}
                      onChange={(e) => setNewAlertTitle(e.target.value)}
                      aria-label="Alert title"
                      placeholder="e.g., Budget pressure warning"
                      disabled={creating}
                    />
                  </label>

                  <label className="ss-muted" style={{ fontSize: 12 }}>
                    Message
                    <textarea
                      className="ss-input"
                      value={newAlertMessage}
                      onChange={(e) => setNewAlertMessage(e.target.value)}
                      aria-label="Alert message"
                      placeholder="Describe what needs attention…"
                      rows={4}
                      disabled={creating}
                      style={{ resize: "vertical" }}
                    />
                  </label>

                  {createError ? (
                    <div
                      role="status"
                      style={{
                        border: "1px solid color-mix(in srgb, var(--ss-danger) 45%, var(--ss-border-color))",
                        background: "color-mix(in srgb, var(--ss-danger) 10%, var(--ss-card-bg))",
                        borderRadius: 14,
                        padding: 10,
                        color: "var(--ss-text-primary)",
                        fontSize: 13,
                      }}
                    >
                      {createError}
                    </div>
                  ) : null}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
                    <Button variant="ghost" type="button" onClick={closeNewAlert} disabled={creating} aria-label="Cancel">
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={creating || !newAlertMessage.trim()} aria-label="Create alert">
                      {creating ? "Creating…" : "Create"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

