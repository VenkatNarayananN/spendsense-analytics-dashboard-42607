import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Chip, PageHeader } from "../components/ui";
import Logo from "../components/Logo";
import { useAuth } from "../auth/AuthProvider";
import { usePreferences } from "../state/preferences";
import { fetchProfile, mapSupabaseProfileToLocal, uploadAvatar, upsertProfile } from "../lib/profileService";
import { isSupabaseConfiguredFn } from "../lib/supabaseClient";

function safeTrim(s) {
  const v = String(s ?? "");
  const t = v.trim();
  return t;
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

function initialsFor(nameOrEmail) {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "?";
  if (s.includes("@")) {
    const local = s.split("@")[0] || "";
    const chars = local.replace(/[^a-z0-9]/gi, "").slice(0, 2);
    return (chars || local.slice(0, 2) || "?").toUpperCase();
  }
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase();
}

/**
 * PUBLIC_INTERFACE
 * Basic avatar URL validation:
 * - empty is allowed (means "no avatar")
 * - must be a valid http(s) URL
 * - or a data:image/* base64 URL (for local previews)
 */
function validateAvatarUrl(input) {
  const v = safeTrim(input);
  if (!v) return { ok: true, value: "" };

  // Allow local preview data URLs so the app stays responsive even before upload.
  if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(v)) return { ok: true, value: v };

  try {
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { ok: false, message: "Avatar URL must start with http:// or https:// (or be a data:image/* URL)." };
    }
    return { ok: true, value: u.toString() };
  } catch {
    return { ok: false, message: "Please enter a valid URL (http/https) or leave it blank." };
  }
}

// PUBLIC_INTERFACE
export default function ProfilePage() {
  /** Profile page: Supabase-backed fields (full name, phone, avatar) with immediate topbar refresh via Preferences context. */
  const { user, loading: authLoading } = useAuth();
  const { profile, setProfile } = usePreferences();

  const supabaseConfigured = isSupabaseConfiguredFn();
  const userId = user?.id;

  const email = user?.email || profile?.email || "";

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // What we show as the current avatar preview (can be a public URL, a pasted URL, or a data URL preview).
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(profile?.avatarUrl || "");
  const [pickedAvatarFile, setPickedAvatarFile] = useState(null);

  // Explicit UI warning banner that is non-blocking (separate from status chip).
  const [warningBanner, setWarningBanner] = useState("");

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ tone: "primary", text: "" });

  // Load profile from Supabase after auth resolves.
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (authLoading) return;
      if (!userId) {
        // Should never happen due to route protection, but keep safe.
        if (mounted) {
          setLoadingProfile(false);
        }
        return;
      }

      // Always keep local context email synced (topbar fallback correctness).
      setProfile((p) => ({ ...p, email: email || p.email }));

      if (!supabaseConfigured) {
        // Demo mode fallback to local storage-only fields.
        if (mounted) {
          setFullName(profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || "");
          setPhone(profile?.phone || "");
          setAvatarPreviewUrl(profile?.avatarUrl || "");
          setLoadingProfile(false);
          setWarningBanner("Supabase is not configured. Storage uploads are unavailable; use the Avatar URL fallback.");
          setStatus({
            tone: "warn",
            text: "Supabase is not configured. Profile edits will be stored locally (demo mode).",
          });
        }
        return;
      }

      setLoadingProfile(true);
      const res = await fetchProfile(userId);

      if (!mounted) return;

      if (!res.ok) {
        setLoadingProfile(false);
        setWarningBanner("Could not load profile from Supabase. You can still edit and try saving.");
        setStatus({
          tone: "warn",
          text: "Could not load profile from Supabase. You can still edit and try saving.",
        });
        // Populate draft with local/profile fallback
        setFullName(profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || "");
        setPhone(profile?.phone || "");
        setAvatarPreviewUrl(profile?.avatarUrl || "");
        return;
      }

      const supaRow = res.profile;
      const localMapped = mapSupabaseProfileToLocal({ ...supaRow, email });

      setFullName(localMapped.name || user?.user_metadata?.full_name || user?.user_metadata?.name || "");
      setPhone(localMapped.phone || "");
      setAvatarPreviewUrl(localMapped.avatarUrl || "");

      // Refresh global profile context for topbar immediately on load.
      setProfile((p) => ({
        ...p,
        email: email || p.email,
        name: localMapped.name || p.name,
        phone: localMapped.phone || p.phone,
        avatarUrl: localMapped.avatarUrl || p.avatarUrl,
      }));

      setLoadingProfile(false);
      setWarningBanner("");
      setStatus({ tone: "primary", text: "" });
    })();

    return () => {
      mounted = false;
    };
  }, [authLoading, email, profile?.avatarUrl, profile?.name, profile?.phone, setProfile, supabaseConfigured, user, userId]);

  const displayName = useMemo(() => safeTrim(fullName) || email || "Account", [email, fullName]);
  const initials = useMemo(() => initialsFor(displayName), [displayName]);

  const avatarStyle = useMemo(() => {
    const has = Boolean(avatarPreviewUrl);
    return {
      width: 88,
      height: 88,
      borderRadius: 22,
      border: "1px solid var(--ss-border)",
      background: has
        ? `center / cover no-repeat url(${avatarPreviewUrl})`
        : "linear-gradient(135deg, rgba(0,163,191,0.22), rgba(11,99,197,0.18))",
      boxShadow: "var(--ss-shadow-sm)",
      display: "grid",
      placeItems: "center",
      overflow: "hidden",
      color: "rgba(255,255,255,0.92)",
      fontWeight: 900,
      fontSize: 22,
      letterSpacing: 0.5,
    };
  }, [avatarPreviewUrl]);

  const setOk = (text) => setStatus({ tone: "success", text });
  const setWarn = (text) => setStatus({ tone: "warn", text });
  const setErr = (text) => setStatus({ tone: "error", text });

  const onPickAvatar = async (file) => {
    if (!file) return;
    setPickedAvatarFile(file);

    // Prefer a fast preview even before upload.
    // Important: do NOT update the Topbar with a data URL yet; only update it once we have a stable saved URL.
    // Otherwise, if upload fails and user closes the page, the topbar would show a temporary preview.
    try {
      const dataUrl = await fileToDataUrl(file);
      setAvatarPreviewUrl(dataUrl);
      setWarningBanner("");
      setStatus({ tone: "primary", text: "" });
    } catch (e) {
      setErr(e?.message || "Failed to read image file.");
    }
  };

  const onRemoveAvatar = () => {
    setPickedAvatarFile(null);
    setAvatarPreviewUrl("");
    setWarningBanner("");
    setProfile((p) => ({ ...p, avatarUrl: "" }));
    setStatus({ tone: "primary", text: "" });
  };

  const onSave = async () => {
    if (!userId) return;

    setSaving(true);
    setStatus({ tone: "primary", text: "" });

    const nameTrim = safeTrim(fullName);
    const phoneTrim = safeTrim(phone);

    // Validate avatar URL before persisting; empty is allowed.
    const avatarValidation = validateAvatarUrl(avatarPreviewUrl);
    if (!avatarValidation.ok) {
      setErr(avatarValidation.message);
      setSaving(false);
      return;
    }

    try {
      // Demo-mode: just persist to local context/storage and return.
      if (!supabaseConfigured) {
        const urlToPersist = avatarValidation.value || "";
        setProfile((p) => ({
          ...p,
          email: email || p.email,
          name: nameTrim || p.name,
          phone: phoneTrim,
          avatarUrl: urlToPersist,
        }));
        setOk("Saved locally (demo mode).");
        return;
      }

      let avatarUrlToSave = avatarValidation.value ? avatarValidation.value : null;

      // 1) upload avatar (if picked)
      if (pickedAvatarFile) {
        try {
          const up = await uploadAvatar(userId, pickedAvatarFile);
          if (!up.ok) {
            // Storage fallback: allow URL input + persist avatar_url from the URL (or clear).
            setWarningBanner(
              `Avatar upload failed (Storage may be unavailable or blocked by policy). You can paste an image URL below and Save. Details: ${
                up.error?.message || "unknown"
              }`
            );
            setWarn("Avatar upload failed; you can still save using the Avatar URL fallback.");
          } else {
            avatarUrlToSave = up.publicUrl;
            setAvatarPreviewUrl(up.publicUrl);
            setWarningBanner("");
          }
        } catch (e) {
          // Defensive: supabase client/bucket missing could throw in some edge cases.
          setWarningBanner(
            `Avatar upload is unavailable right now. You can paste an image URL below and Save. Details: ${e?.message || "unknown"}`
          );
          setWarn("Avatar upload unavailable; you can still save using the Avatar URL fallback.");
        }
      }

      // 2) upsert profile row
      const upsert = await upsertProfile(userId, {
        full_name: nameTrim || null,
        phone: phoneTrim || null,
        avatar_url: avatarUrlToSave,
      });

      if (!upsert.ok) {
        throw upsert.error;
      }

      // 3) refresh global context so Topbar updates immediately with the persisted avatar.
      const row = upsert.profile;
      const mapped = mapSupabaseProfileToLocal({ ...row, email });

      setProfile((p) => ({
        ...p,
        email: email || p.email,
        name: mapped.name || p.name,
        phone: mapped.phone,
        avatarUrl: mapped.avatarUrl || "",
      }));

      setPickedAvatarFile(null);
      setOk("Profile saved.");
    } catch (e) {
      setErr(e?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main role="main" aria-label="Profile">
      <PageHeader
        title="Profile"
        description="Manage your personal details and avatar. Changes reflect immediately in the topbar."
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size="sm" alt="SpendSense logo" />
            {supabaseConfigured ? <Chip tone="success">Supabase</Chip> : <Chip tone="warn">Demo mode</Chip>}
          </div>
        }
      />

      <div className="ss-grid ss-grid-2" aria-label="profile grid">
        <Card
          title="Your details"
          caption="Full name & phone are editable. Email is read-only."
          right={status?.text ? <Chip tone={status.tone}>{status.text}</Chip> : null}
        >
          {warningBanner ? (
            <div
              role="status"
              aria-live="polite"
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(245, 158, 11, 0.35)",
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.10), rgba(244, 114, 182, 0.08))",
                color: "var(--ss-text)",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: 0.2, marginBottom: 2 }}>Heads up</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>{warningBanner}</div>
              </div>
              <button
                type="button"
                className="ss-btn ss-btn-ghost"
                onClick={() => setWarningBanner("")}
                aria-label="Dismiss warning"
                style={{ padding: "6px 10px", height: "fit-content" }}
              >
                Dismiss
              </button>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div aria-label="Avatar preview" style={avatarStyle}>
              {!avatarPreviewUrl ? <span aria-hidden="true">{initials}</span> : null}
            </div>

            <div style={{ flex: "1 1 320px", minWidth: 240 }}>
              <label className="ss-muted" style={{ fontSize: 12, display: "block" }}>
                Full name
                <input
                  className="ss-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  aria-label="Full name"
                  placeholder="Your name"
                  disabled={loadingProfile}
                />
              </label>

              <div style={{ height: 10 }} />

              <label className="ss-muted" style={{ fontSize: 12, display: "block" }}>
                Phone number
                <input
                  className="ss-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-label="Phone number"
                  placeholder="+1 555 123 4567"
                  disabled={loadingProfile}
                />
              </label>

              <div style={{ height: 10 }} />

              <label className="ss-muted" style={{ fontSize: 12, display: "block" }}>
                Email (read-only)
                <input className="ss-input" value={email} readOnly aria-label="Email address (read-only)" />
              </label>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <label className="ss-btn ss-btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickAvatar(e.target.files && e.target.files[0])}
                aria-label="Upload avatar image"
                style={{ display: "none" }}
                disabled={loadingProfile}
              />
              Upload avatar
            </label>

            <Button variant="ghost" onClick={onRemoveAvatar} aria-label="Remove avatar" disabled={loadingProfile}>
              Remove avatar
            </Button>

            <Button onClick={onSave} aria-label="Save profile" disabled={saving || loadingProfile}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>

          {!supabaseConfigured ? (
            <p className="ss-card-caption" style={{ marginTop: 10 }}>
              Supabase is not configured, so this page stores changes locally. Set <code>REACT_APP_SUPABASE_URL</code> and{" "}
              <code>REACT_APP_SUPABASE_KEY</code> to enable real profile persistence.
            </p>
          ) : null}
        </Card>

        <Card
          title="Avatar URL (fallback)"
          caption="If Storage upload is blocked/unavailable, you can paste a URL. This will be saved into profiles.avatar_url."
        >
          <label className="ss-muted" style={{ fontSize: 12, display: "block" }}>
            Avatar URL
            <input
              className="ss-input"
              value={avatarPreviewUrl}
              onChange={(e) => {
                const v = e.target.value;
                setAvatarPreviewUrl(v);
                // If user starts typing a URL, they are explicitly choosing the URL path.
                setPickedAvatarFile(null);
                setWarningBanner("");
              }}
              aria-label="Avatar URL"
              placeholder="https://…"
              disabled={loadingProfile}
            />
          </label>

          <div className="ss-divider" />

          <p className="ss-card-caption" style={{ marginBottom: 0 }}>
            Accepted formats: <code>https://…</code> (recommended) or <code>http://…</code>. You can also leave it blank to clear your avatar.
          </p>
          <p className="ss-card-caption">
            Storage bucket: <code>avatars</code>. Expected path format: <code>avatars/{`{userId}`}/{`{timestamp}`}.png</code>. Ensure Storage
            policies allow authenticated users to upload/read their own folder.
          </p>
        </Card>
      </div>
    </main>
  );
}

