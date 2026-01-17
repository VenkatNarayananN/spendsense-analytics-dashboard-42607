import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

/**
 * PUBLIC_INTERFACE
 * Protects routes using auth context; waits for auth loading to resolve before redirecting.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Avoid redirecting while auth is still resolving (prevents flicker and bad redirects).
  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <div className="ss-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Checking session…</div>
          <div className="ss-muted" style={{ fontSize: 13 }}>
            Please wait.
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

