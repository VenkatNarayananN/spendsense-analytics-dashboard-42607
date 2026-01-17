import React, { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Chip } from "../components/ui";
import { useAuth } from "../auth/AuthProvider";
import { isSupabaseConfiguredFn } from "../lib/supabaseClient";
import Logo from "../components/Logo";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

// PUBLIC_INTERFACE
export default function LoginPage() {
  /** Sign in page using Supabase Auth (email/password). */
  const { isAuthenticated, login, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const supabaseConfigured = isSupabaseConfiguredFn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [info, setInfo] = useState(() => {
    const st = loc.state;
    if (st && typeof st === "object" && st.signup === "check_email") {
      return "Account created. Please check your email to confirm before signing in (if confirmations are enabled).";
    }
    return "";
  });

  const from = useMemo(() => {
    const st = loc.state;
    // ProtectedRoute sets `state.from` to the pathname; after login we redirect there,
    // otherwise to dashboard root.
    return st && typeof st === "object" && st.from ? st.from : "/";
  }, [loc.state]);

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email)) next.email = "Please enter a valid email address.";
    if (!password) next.password = "Password is required.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const canSubmit = useMemo(() => {
    if (!supabaseConfigured) return false;
    if (!email.trim() || !password) return false;
    if (!isValidEmail(email)) return false;
    return true;
  }, [supabaseConfigured, email, password]);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setInfo("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (!res?.ok) {
        setFormError(res?.error?.message || "Sign in failed.");
        return;
      }
      nav(from, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      role="main"
      aria-label="Sign in"
      style={{
        minHeight: "calc(100vh - var(--ss-topbar-h))",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div style={{ width: "min(980px, 100%)", display: "grid", gap: 18, gridTemplateColumns: "1fr" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Logo size="lg" alt="SpendSense logo" />
            <div>
              <h1 className="ss-section-title" style={{ marginBottom: 6 }}>Sign in</h1>
              <p className="ss-section-desc">Authenticate with Supabase to access your dashboard</p>
            </div>
          </div>
          <Chip tone="secondary" title="Authentication provider">
            Supabase Auth
          </Chip>
        </div>

        <div className="ss-grid ss-grid-2" style={{ alignItems: "start" }}>
          <Card title="Sign in" caption="Use your Supabase email + password credentials.">
            {!supabaseConfigured ? (
              <div className="ss-card-caption" style={{ color: "var(--ss-error)" }}>
                Supabase is not configured. This app requires an authenticated Supabase session. Demo/mock sign-in has been removed.
              </div>
            ) : null}

            <form onSubmit={onSubmit} style={{ marginTop: 10 }}>
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
                  autoComplete="current-password"
                  disabled={loading || submitting}
                />
              </label>
              {fieldErrors.password ? (
                <div className="ss-card-caption" style={{ marginTop: 6, color: "var(--ss-error)" }}>
                  {fieldErrors.password}
                </div>
              ) : null}

              {info ? (
                <div className="ss-card-caption" style={{ marginTop: 10, color: "rgba(137, 241, 255, 0.92)" }}>
                  {info}
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
                  {submitting ? "Signing in…" : "Sign in"}
                </Button>

                <Link to="/signup" style={{ textDecoration: "none" }}>
                  <Button type="button" variant="ghost" disabled={loading || submitting}>
                    Create an account
                  </Button>
                </Link>
              </div>

              <p className="ss-card-caption" style={{ marginTop: 12 }}>
                This app requires an authenticated Supabase session. Demo/mock sign-in has been removed.
              </p>
            </form>
          </Card>

          <Card title="Getting started" caption="Quick notes">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                Login uses <code style={{ fontFamily: "var(--ss-mono)" }}>supabase.auth.signInWithPassword()</code>.
              </li>
              <li className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                Your session persists across refresh (enabled in the Supabase client).
              </li>
              <li className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                After sign in you will be redirected to:{" "}
                <code style={{ fontFamily: "var(--ss-mono)" }}>{from}</code>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </main>
  );
}
