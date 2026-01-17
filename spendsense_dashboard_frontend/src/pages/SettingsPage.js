import React, { useMemo, useState } from "react";
import { Button, Card, Chip, PageHeader } from "../components/ui";

function envBool(raw) {
  if (!raw) return false;
  const v = String(raw).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

// PUBLIC_INTERFACE
export default function SettingsPage() {
  /** Settings placeholders; reads env safely and never fails if env is missing. */
  const supabase = useMemo(() => {
    const url = process.env.REACT_APP_SUPABASE_URL || "";
    const key = process.env.REACT_APP_SUPABASE_KEY || "";
    return { hasUrl: Boolean(url), hasKey: Boolean(key) };
  }, []);

  const featureFlagsEnv = process.env.REACT_APP_FEATURE_FLAGS || "";
  const [featureFlagsEnabled, setFeatureFlagsEnabled] = useState(envBool(featureFlagsEnv));

  const apiBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "";

  return (
    <main role="main" aria-label="Settings">
      <PageHeader
        title="Settings"
        description="Profile, configuration, and feature flags. (Read-only placeholders for now.)"
        right={<Chip tone="primary">v0.1 UI</Chip>}
      />

      <div className="ss-grid ss-grid-2" aria-label="settings grid">
        <Card
          title="Profile"
          caption="Placeholder — connect auth later"
          right={<Chip tone="secondary">Coming soon</Chip>}
        >
          <p className="ss-card-caption" style={{ marginTop: 0 }}>
            Add user profile details, connected accounts, and notification preferences here.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <Button variant="ghost" aria-label="Edit profile (not implemented)" onClick={() => {}}>
              Edit profile
            </Button>
            <Button variant="ghost" aria-label="Manage notifications (not implemented)" onClick={() => {}}>
              Notifications
            </Button>
          </div>
        </Card>

        <Card title="Theme Preview" caption="Elegant Rose Gold — soft gradients, rounded components">
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Chip tone="primary">Primary</Chip>
              <Chip tone="secondary">Accent</Chip>
              <Chip tone="success">Success</Chip>
              <Chip tone="error">Error</Chip>
            </div>

            <div
              style={{
                borderRadius: 18,
                border: "1px solid var(--ss-border)",
                background: "var(--ss-gradient)",
                padding: 14,
              }}
              aria-label="Theme gradient preview"
            >
              <div className="ss-muted" style={{ fontSize: 12 }}>
                Gradient: rose-50 → purple-50
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                <Button onClick={() => {}} aria-label="Primary button preview">
                  Primary button
                </Button>
                <Button variant="secondary" onClick={() => {}} aria-label="Secondary button preview">
                  Accent button
                </Button>
                <Button variant="ghost" onClick={() => {}} aria-label="Ghost button preview">
                  Ghost button
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="Feature Flags"
          caption="Bound to REACT_APP_FEATURE_FLAGS when present"
          right={<Chip tone={featureFlagsEnabled ? "success" : "secondary"}>{featureFlagsEnabled ? "Enabled" : "Disabled"}</Chip>}
        >
          <p className="ss-card-caption" style={{ marginTop: 0 }}>
            Environment value: <code style={{ fontFamily: "var(--ss-mono)" }}>{featureFlagsEnv || "(empty)"}</code>
          </p>

          <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <input
              type="checkbox"
              checked={featureFlagsEnabled}
              onChange={(e) => setFeatureFlagsEnabled(e.target.checked)}
              aria-label="Toggle feature flags (local UI only)"
            />
            <span style={{ fontWeight: 800, fontSize: 13 }}>Enable feature flags (UI only)</span>
          </label>

          <p className="ss-card-caption" style={{ marginTop: 10 }}>
            Note: This toggle changes local UI state only. For real rollouts, flags should be driven by environment or remote config.
          </p>
        </Card>

        <Card title="Supabase" caption="Presence check for URL/Key (read-only)">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Chip tone={supabase.hasUrl ? "success" : "error"}>URL: {supabase.hasUrl ? "present" : "missing"}</Chip>
            <Chip tone={supabase.hasKey ? "success" : "error"}>Key: {supabase.hasKey ? "present" : "missing"}</Chip>
          </div>

          <div className="ss-divider" />

          <p className="ss-card-caption" style={{ margin: 0 }}>
            API base (optional, for later wiring):{" "}
            <code style={{ fontFamily: "var(--ss-mono)" }}>{apiBase ? apiBase : "(not set)"}</code>
          </p>
        </Card>
      </div>
    </main>
  );
}
