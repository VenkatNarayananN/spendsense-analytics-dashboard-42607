import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Chip } from "../components/ui";
import { useAuth } from "../auth/AuthProvider";
import { getSupabaseDiagnostics } from "../lib/supabaseClient";
import AppLogo from "../components/AppLogo";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

// PUBLIC_INTERFACE
export default function LoginPage() {
  /** Sign in page using Supabase Auth (email/password). */
  const { isAuthenticated, login, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const supabaseDiag = useMemo(() => getSupabaseDiagnostics(), []);

  // Small runtime diagnostic for debugging env wiring issues (safe: no full key exposure).
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.info("[login] Supabase diagnostics:", {
      configured: supabaseDiag.configured,
      urlPresent: supabaseDiag.urlPresent,
      keyPresent: supabaseDiag.keyPresent,
      urlValue: supabaseDiag.urlValue,
      keySuffix: supabaseDiag.keySuffix ? `…${supabaseDiag.keySuffix}` : "",
    });
  }, [supabaseDiag]);

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
    // ProtectedRoute/AuthGate sets `state.from` to the pathname; after login we redirect there.
    // If no prior protected destination exists, redirect to /dashboard per requirement.
    return st && typeof st === "object" && st.from ? st.from : "/dashboard";
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
    // Sign In should only be disabled while auth is loading/submitting or fields are empty/invalid.
    // Do NOT disable based on Supabase env; misconfig will surface as a submit-time error + banner.
    if (!email.trim() || !password) return false;
    if (!isValidEmail(email)) return false;
    return true;
  }, [email, password]);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

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
      // Requirement: after successful signInWithPassword, redirect to /dashboard (or prior protected route).
      nav(from || "/dashboard", { replace: true });
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
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <AppLogo
                variant="full"
                size="lg"
                alt="SpendSense logo"
                style={{
                  // auth header needs a subtle “badge” like other surfaces, while staying theme-consistent
                  padding: 8,
                  borderRadius: 14,
                  border: "1px solid color-mix(in srgb, var(--ss-border-color) 85%, transparent)",
                  background: "color-mix(in srgb, var(--ss-card-bg) 40%, transparent)",
                  boxShadow: "var(--ss-shadow-sm)",
                  backdropFilter: "blur(10px)",
                }}
              />
            </div>

            <div style={{ textAlign: "center" }}>
              <h1 className="ss-section-title" style={{ marginBottom: 6 }}>
                Sign in
              </h1>
              <p className="ss-section-desc">Authenticate with Supabase to access your dashboard</p>
            </div>
          </div>

          <Chip tone="secondary" title="Authentication provider">
            Supabase Auth
          </Chip>
        </div>

        <div className="ss-grid ss-grid-2" style={{ alignItems: "start" }}>
          <Card title="Sign in" caption="Use your Supabase email + password credentials.">
            <div
              className="ss-card-caption"
              style={{
                border: "1px solid var(--ss-border-color)",
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--ss-card-bg) 88%, var(--ss-secondary) 12%), color-mix(in srgb, var(--ss-card-bg) 92%, var(--ss-primary) 8%))",
                padding: 10,
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              <div className="ss-muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Runtime diagnostics
              </div>
              <div style={{ display: "grid", gap: 4, fontSize: 12 }}>
                <div>
                  <strong>Supabase configured:</strong> {supabaseDiag.configured ? "yes" : "no"}
                </div>
                <div>
                  <strong>URL present:</strong> {supabaseDiag.urlPresent ? "yes" : "no"}{" "}
                  {supabaseDiag.urlPresent ? (
                    <span className="ss-muted" style={{ marginLeft: 6 }}>
                      ({supabaseDiag.urlValue})
                    </span>
                  ) : null}
                </div>
                <div>
                  <strong>Key present:</strong> {supabaseDiag.keyPresent ? "yes" : "no"}{" "}
                  {supabaseDiag.keyPresent ? (
                    <span className="ss-muted" style={{ marginLeft: 6 }}>
                      (…{supabaseDiag.keySuffix})
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {!supabaseDiag.configured ? (
              <div className="ss-card-caption" style={{ color: "var(--ss-error)" }}>
                Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY (or supported fallbacks). You can still
                interact with the form; submission will fail until env is set.
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

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <Button type="submit" disabled={loading || submitting || !canSubmit}>
                  {submitting ? "Signing in…" : "Sign in"}
                </Button>

                <span className="ss-muted" style={{ fontSize: 13 }}>
                  New here?{" "}
                  <Link to="/signup" style={{ color: "var(--ss-primary)", fontWeight: 600 }}>
                    Create account
                  </Link>
                </span>
              </div>

              <p className="ss-card-caption" style={{ marginTop: 12 }}>
                This app requires an authenticated Supabase session.
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
                After sign in you will be redirected to: <code style={{ fontFamily: "var(--ss-mono)" }}>{from}</code>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </main>
  );
}
