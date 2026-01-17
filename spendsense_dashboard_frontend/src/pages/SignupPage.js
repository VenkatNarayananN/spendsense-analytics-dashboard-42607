import React, { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button, Card, Chip } from "../components/ui";
import { useAuth } from "../auth/AuthProvider";
import { getSupabase, isSupabaseConfiguredFn } from "../lib/supabaseClient";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

// PUBLIC_INTERFACE
export default function SignupPage() {
  /** Create account page using Supabase Auth (email/password). */
  const { isAuthenticated, loading } = useAuth();
  const nav = useNavigate();

  const supabase = getSupabase();
  const supabaseConfigured = isSupabaseConfiguredFn();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  const canSubmit = useMemo(() => {
    if (!supabaseConfigured) return false;
    if (!email.trim() || !password || !confirm) return false;
    if (password !== confirm) return false;
    if (!isValidEmail(email)) return false;
    return true;
  }, [supabaseConfigured, email, password, confirm]);

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email)) next.email = "Please enter a valid email address.";

    if (!password) next.password = "Password is required.";
    if (!confirm) next.confirm = "Please confirm your password.";
    if (password && confirm && password !== confirm) next.confirm = "Passwords do not match.";

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    if (!supabaseConfigured || !supabase) {
      setFormError("Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // Optional profile data; stored in user_metadata.
          data: fullName.trim() ? { full_name: fullName.trim() } : {},
          // IMPORTANT: If you enable email confirmations and want a redirect URL, set it here using an env var.
          // For example: emailRedirectTo: process.env.REACT_APP_FRONTEND_URL
        },
      });

      if (error) {
        setFormError(error.message || "Account creation failed.");
        return;
      }

      // If email confirmation is enabled, session may be null until verified.
      // Still redirect to dashboard per requirement; ProtectedRoute will bounce to login if not authenticated.
      if (data?.session) {
        nav("/", { replace: true });
      } else {
        nav("/login", { replace: true, state: { signup: "check_email" } });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // If already authenticated, go to dashboard (root acts as dashboard in this app).
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <main
      role="main"
      aria-label="Create account"
      style={{
        minHeight: "calc(100vh - var(--ss-topbar-h))",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div style={{ width: "min(980px, 100%)", display: "grid", gap: 18, gridTemplateColumns: "1fr" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 className="ss-section-title" style={{ marginBottom: 6 }}>Create account</h1>
            <p className="ss-section-desc">Create your SpendSense account using Supabase Auth</p>
          </div>
          <Chip tone="secondary" title="Authentication provider">
            Supabase Auth
          </Chip>
        </div>

        <div className="ss-grid ss-grid-2" style={{ alignItems: "start" }}>
          <Card title="Create account" caption="Use email + password. Full name is optional.">
            {!supabaseConfigured ? (
              <div className="ss-card-caption" style={{ color: "var(--ss-error)" }}>
                Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY to enable authentication.
              </div>
            ) : null}

            <form onSubmit={onSubmit} style={{ marginTop: 10 }}>
              <label className="ss-muted" style={{ fontSize: 12, display: "block" }}>
                Full name (optional)
                <input
                  className="ss-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Morgan"
                  aria-label="Full name"
                  autoComplete="name"
                  disabled={loading || submitting}
                />
              </label>

              <div style={{ height: 10 }} />

              <label className="ss-muted" style={{ fontSize: 12, display: "block" }}>
                Email
                <input
                  className="ss-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  aria-label="Email"
                  autoComplete="email"
                  disabled={loading || submitting}
                />
              </label>
              {fieldErrors.email ? (
                <div className="ss-card-caption" style={{ marginTop: 6, color: "var(--ss-error)" }}>
                  {fieldErrors.email}
                </div>
              ) : null}

              <div style={{ height: 10 }} />

              <label className="ss-muted" style={{ fontSize: 12, display: "block" }}>
                Password
                <input
                  className="ss-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  aria-label="Password"
                  type="password"
                  autoComplete="new-password"
                  disabled={loading || submitting}
                />
              </label>
              {fieldErrors.password ? (
                <div className="ss-card-caption" style={{ marginTop: 6, color: "var(--ss-error)" }}>
                  {fieldErrors.password}
                </div>
              ) : null}

              <div style={{ height: 10 }} />

              <label className="ss-muted" style={{ fontSize: 12, display: "block" }}>
                Confirm password
                <input
                  className="ss-input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  aria-label="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  disabled={loading || submitting}
                />
              </label>
              {fieldErrors.confirm ? (
                <div className="ss-card-caption" style={{ marginTop: 6, color: "var(--ss-error)" }}>
                  {fieldErrors.confirm}
                </div>
              ) : null}

              {formError ? (
                <div className="ss-card-caption" style={{ marginTop: 10, color: "var(--ss-error)" }}>
                  {formError}
                </div>
              ) : null}

              <div style={{ height: 14 }} />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button type="submit" disabled={loading || submitting || !canSubmit}>
                  {submitting ? "Creating…" : "Create account"}
                </Button>
                <Link to="/login" style={{ textDecoration: "none" }}>
                  <Button type="button" variant="ghost" disabled={loading || submitting}>
                    Sign in instead
                  </Button>
                </Link>
              </div>

              <p className="ss-card-caption" style={{ marginTop: 12 }}>
                Tip: If email confirmation is enabled in Supabase, you must verify your email before signing in.
              </p>
            </form>
          </Card>

          <Card title="Why Supabase?" caption="Secure session + refresh, persisted across reloads">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                Email/password uses <code style={{ fontFamily: "var(--ss-mono)" }}>supabase.auth.signUp()</code>.
              </li>
              <li className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                Session persistence is enabled in the Supabase client (persistSession + autoRefreshToken).
              </li>
              <li className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                Protected pages should be wrapped with <code style={{ fontFamily: "var(--ss-mono)" }}>ProtectedRoute</code>.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </main>
  );
}
