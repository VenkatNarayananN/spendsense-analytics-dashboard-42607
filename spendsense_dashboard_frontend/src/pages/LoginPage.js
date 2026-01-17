import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Chip, PageHeader } from "../components/ui";
import { useAuth } from "../auth/AuthProvider";

// PUBLIC_INTERFACE
export default function LoginPage() {
  /** Placeholder login page; uses simulated auth state and returns user to intended route after login. */
  const { isAuthenticated, login, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const from = useMemo(() => {
    const st = loc.state;
    return st && typeof st === "object" && st.from ? st.from : "/";
  }, [loc.state]);

  const doLogin = async () => {
    await login();
    nav(from, { replace: true });
  };

  const doLogout = async () => {
    await logout();
  };

  return (
    <main role="main" aria-label="Login">
      <PageHeader
        title="Login"
        description="Placeholder auth UI (no real authentication yet)."
        right={<Chip tone={isAuthenticated ? "success" : "secondary"}>{isAuthenticated ? "Signed in" : "Guest"}</Chip>}
      />

      <div className="ss-grid ss-grid-2" aria-label="login layout">
        <Card title="Simulated Authentication" caption="Use these buttons to toggle access to protected routes">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={doLogin} aria-label="Login (placeholder)" disabled={isAuthenticated}>
              Login
            </Button>
            <Button variant="ghost" onClick={doLogout} aria-label="Logout (placeholder)" disabled={!isAuthenticated}>
              Logout
            </Button>
            <Button variant="secondary" onClick={() => nav(from)} aria-label="Go back">
              Back
            </Button>
          </div>

          <p className="ss-card-caption" style={{ marginTop: 12 }}>
            After login, you will be redirected to: <code style={{ fontFamily: "var(--ss-mono)" }}>{from}</code>
          </p>
        </Card>

        <Card title="What’s next?" caption="Future integration targets">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Connect Supabase auth or backend sessions.
            </li>
            <li className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Persist session in storage and refresh tokens.
            </li>
            <li className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Role-based authorization for admin-only pages.
            </li>
          </ul>
        </Card>
      </div>
    </main>
  );
}

