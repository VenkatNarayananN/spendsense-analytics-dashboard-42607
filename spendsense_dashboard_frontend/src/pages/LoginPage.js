import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Chip, PageHeader } from "../components/ui";
import { useAuth } from "../auth/AuthProvider";
import { isSupabaseConfiguredFn } from "../lib/supabaseClient";

// PUBLIC_INTERFACE
export default function LoginPage() {
  /** Login page using Supabase auth when configured; otherwise stays in demo/guest mode. */
  const { isAuthenticated, login, logout, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const from = useMemo(() => {
    const st = loc.state;
    return st && typeof st === "object" && st.from ? st.from : "/";
  }, [loc.state]);

  const supabaseConfigured = isSupabaseConfiguredFn();

  const doLogin = async () => {
    setErrorMsg("");
    setSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (!res?.ok) {
        setErrorMsg(res?.error?.message || "Login failed");
        return;
      }
      nav(from, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  const doLogout = async () => {
    setErrorMsg("");
    await logout();
  };

  return (
    <main role="main" aria-label="Login">
      <PageHeader
        title="Login"
        description={
          supabaseConfigured
            ? "Sign in to access protected pages. Your session is managed by Supabase."
            : "Supabase is not configured. The app is running in demo mode."
        }
        right={
          <Chip tone={isAuthenticated ? "success" : "secondary"}>{isAuthenticated ? "Signed in" : "Guest"}</Chip>
        }
      />

      <div className="ss-grid ss-grid-2" aria-label="login layout">
        <Card
          title={supabaseConfigured ? "Sign in" : "Demo mode"}
          caption={
            supabaseConfigured
              ? "Use your Supabase user credentials. (Email/password auth must be enabled in Supabase.)"
              : "To enable real login, set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY."
          }
        >
          {supabaseConfigured ? (
            <>
              <label className="ss-muted" style={{ fontSize: 12, display: "block" }}>
                Email
                <input
                  className="ss-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  aria-label="Email"
                  autoComplete="email"
                />
              </label>

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
                />
              </label>

              {errorMsg ? (
                <div style={{ marginTop: 10 }} className="ss-card-caption">
                  <span style={{ color: "var(--ss-danger)" }}>{errorMsg}</span>
                </div>
              ) : null}

              <div style={{ height: 12 }} />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button
                  onClick={doLogin}
                  aria-label="Login"
                  disabled={loading || submitting || isAuthenticated || !email.trim() || !password}
                >
                  {submitting ? "Signing in…" : "Login"}
                </Button>
                <Button variant="ghost" onClick={doLogout} aria-label="Logout" disabled={loading || !isAuthenticated}>
                  Logout
                </Button>
                <Button variant="secondary" onClick={() => nav(from)} aria-label="Go back">
                  Back
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="ss-card-caption" style={{ marginTop: 6 }}>
                You can still explore the dashboard pages. Protected routes will require Supabase configuration.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <Button variant="secondary" onClick={() => nav(from)} aria-label="Go back">
                  Back
                </Button>
              </div>
            </>
          )}

          <p className="ss-card-caption" style={{ marginTop: 12 }}>
            After login, you will be redirected to: <code style={{ fontFamily: "var(--ss-mono)" }}>{from}</code>
          </p>
        </Card>

        <Card title="Notes" caption="Auth + DB calls">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Session/user are available via <code style={{ fontFamily: "var(--ss-mono)" }}>useAuth()</code>.
            </li>
            <li className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              For DB calls, use the shared Supabase client; it automatically attaches auth headers for RLS when a
              session exists.
            </li>
            <li className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Demo mode remains available when Supabase env vars are missing.
            </li>
          </ul>
        </Card>
      </div>
    </main>
  );
}

