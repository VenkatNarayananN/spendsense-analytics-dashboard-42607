import React, { useMemo, useState } from "react";
import { Button, Card, Chip, PageHeader } from "../components/ui";
import { usePreferences } from "../state/preferences";

function isValidCurrency(code) {
  return ["USD", "EUR", "GBP", "CAD", "AUD"].includes(code);
}

function clampBudget(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(50000, Math.round(v)));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) resolve("");
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("Failed to read file"));
    r.readAsDataURL(file);
  });
}

// PUBLIC_INTERFACE
export default function SettingsPage() {
  /** Settings: editable profile, user preferences, and demo mode toggle (analytics pages only). */
  const { prefs, setPrefs, profile, setProfile } = usePreferences();

  const [nameDraft, setNameDraft] = useState(profile.name || "");
  const [budgetDraft, setBudgetDraft] = useState(String(prefs.monthlyBudget ?? 0));
  const [saving, setSaving] = useState(false);

  const currencyOptions = useMemo(() => ["USD", "EUR", "GBP", "CAD", "AUD"], []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      // Placeholder: when Supabase profile is wired, replace this with an update call.
      setProfile((p) => ({ ...p, name: nameDraft.trim() || p.name }));
      setPrefs((p) => ({ ...p, monthlyBudget: clampBudget(budgetDraft) }));
    } finally {
      window.setTimeout(() => setSaving(false), 250);
    }
  };

  const onAvatarPick = async (file) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setProfile((p) => ({ ...p, avatarUrl: dataUrl }));
  };

  return (
    <main role="main" aria-label="Settings">
      <PageHeader
        title="Settings"
        description="Manage your profile and preferences. Demo mode only changes analytics pages."
        right={<Chip tone="primary">SpendSense</Chip>}
      />

      <div className="ss-grid ss-grid-2" aria-label="settings grid">
        <Card title="Profile" caption="Name and avatar are editable; email is read-only">
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div
              aria-label="Avatar preview"
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                border: "1px solid var(--ss-border)",
                background:
                  profile.avatarUrl
                    ? `center / cover no-repeat url(${profile.avatarUrl})`
                    : "linear-gradient(135deg, rgba(0,163,191,0.22), rgba(11,99,197,0.18))",
                boxShadow: "var(--ss-shadow-sm)",
              }}
            />
            <div style={{ flex: "1 1 260px", minWidth: 220 }}>
              <label className="ss-muted" style={{ fontSize: 12, display: "block" }}>
                Full name
                <input
                  className="ss-input"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  aria-label="Full name"
                  placeholder="Your name"
                />
              </label>

              <div style={{ height: 10 }} />

              <label className="ss-muted" style={{ fontSize: 12, display: "block" }}>
                Email (read-only)
                <input className="ss-input" value={profile.email || ""} readOnly aria-label="Email address (read-only)" />
              </label>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <label className="ss-btn ss-btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onAvatarPick(e.target.files && e.target.files[0])}
                aria-label="Upload avatar image"
                style={{ display: "none" }}
              />
              Upload avatar
            </label>

            <Button
              variant="ghost"
              onClick={() => setProfile((p) => ({ ...p, avatarUrl: "" }))}
              aria-label="Remove avatar"
              disabled={!profile.avatarUrl}
            >
              Remove avatar
            </Button>

            <Button onClick={saveProfile} aria-label="Save profile and preferences" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>

          <p className="ss-card-caption" style={{ marginTop: 10 }}>
            Note: Profile is stored locally until Supabase profile syncing is connected.
          </p>
        </Card>

        <Card title="Preferences" caption="Personalize your dashboard and alerts">
          <div style={{ display: "grid", gap: 12 }}>
            <label className="ss-muted" style={{ fontSize: 12 }}>
              Default currency
              <select
                className="ss-select"
                value={prefs.currency}
                onChange={(e) => {
                  const v = e.target.value;
                  setPrefs((p) => ({ ...p, currency: isValidCurrency(v) ? v : "USD" }));
                }}
                aria-label="Select currency"
              >
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="ss-muted" style={{ fontSize: 12 }}>
              Monthly budget
              <input
                className="ss-input"
                inputMode="numeric"
                value={budgetDraft}
                onChange={(e) => setBudgetDraft(e.target.value)}
                aria-label="Monthly budget"
                placeholder="2200"
              />
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                checked={prefs.alertsEnabled}
                onChange={(e) => setPrefs((p) => ({ ...p, alertsEnabled: e.target.checked }))}
                aria-label="Enable alerts"
              />
              <span style={{ fontWeight: 800, fontSize: 13 }}>Enable alerts</span>
              <Chip tone={prefs.alertsEnabled ? "success" : "warn"}>{prefs.alertsEnabled ? "On" : "Off"}</Chip>
            </label>
          </div>

          <div className="ss-divider" />

          <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="checkbox"
              checked={prefs.demoMode}
              onChange={(e) => setPrefs((p) => ({ ...p, demoMode: e.target.checked }))}
              aria-label="Toggle demo mode (analytics pages only)"
            />
            <span style={{ fontWeight: 800, fontSize: 13 }}>Demo mode</span>
            <Chip tone={prefs.demoMode ? "secondary" : "primary"}>{prefs.demoMode ? "Enabled" : "Disabled"}</Chip>
          </label>

          <p className="ss-card-caption" style={{ marginTop: 10 }}>
            Demo mode affects only: Dashboard, Transactions, Insights, Alerts. Profile settings are always editable.
          </p>
        </Card>
      </div>
    </main>
  );
}

