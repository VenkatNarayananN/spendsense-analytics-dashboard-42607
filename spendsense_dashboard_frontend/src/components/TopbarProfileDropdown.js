import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { usePreferences } from "../state/preferences";

/**
 * Compute a compact "display name" from available profile/user data.
 * Preference order:
 *  1) locally edited profile.name
 *  2) user metadata full_name/name
 *  3) email
 */
function computeDisplayName({ profile, user }) {
  const pName = profile?.name?.trim();
  if (pName) return pName;

  const metaName = user?.user_metadata?.full_name || user?.user_metadata?.name;
  if (metaName && String(metaName).trim()) return String(metaName).trim();

  return user?.email || profile?.email || "Account";
}

function computeEmail({ profile, user }) {
  return user?.email || profile?.email || "";
}

function initialsFor(nameOrEmail) {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "?";
  // If looks like email, take first 2 letters of the local part
  if (s.includes("@")) {
    const local = s.split("@")[0] || "";
    const chars = local.replace(/[^a-z0-9]/gi, "").slice(0, 2);
    return (chars || local.slice(0, 2) || "?").toUpperCase();
  }

  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase();
}

// PUBLIC_INTERFACE
export default function TopbarProfileDropdown() {
  /** Topbar profile dropdown showing avatar/initials and name, with Profile/Settings links and Sign out action. */
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { profile, setProfile } = usePreferences();

  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const buttonId = useId();
  const menuId = useId();

  const wrapperRef = useRef(null);

  // Keep local profile email in sync with live auth user.
  // This ensures the topbar can show "fallback to email" correctly even if profile isn't manually edited.
  useEffect(() => {
    if (!user?.email) return;
    setProfile((p) => ({ ...p, email: user.email || p.email }));
  }, [setProfile, user?.email]);

  const displayName = useMemo(() => computeDisplayName({ profile, user }), [profile, user]);
  const email = useMemo(() => computeEmail({ profile, user }), [profile, user]);
  const initials = useMemo(() => initialsFor(displayName || email), [displayName, email]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      const el = wrapperRef.current;
      if (!el) return;
      if (!el.contains(e.target)) setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => window.removeEventListener("pointerdown", onPointerDown, { capture: true });
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const go = (to) => {
    setOpen(false);
    navigate(to);
  };

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      // Must sign out via Supabase then redirect to /login per requirements.
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
      setOpen(false);
    }
  };

  // In demo mode (no session), Navbar itself hides for unauthenticated shell,
  // but keep this defensive check.
  if (!isAuthenticated) return null;

  return (
    <div className="ss-prof" ref={wrapperRef}>
      <button
        id={buttonId}
        type="button"
        className="ss-prof-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ss-prof-avatar" aria-label={profile?.avatarUrl ? "User avatar" : "User initials"}>
          {profile?.avatarUrl ? (
            <span
              className="ss-prof-avatar-img"
              style={{ backgroundImage: `url(${profile.avatarUrl})` }}
              aria-hidden="true"
            />
          ) : (
            <span className="ss-prof-avatar-initials" aria-hidden="true">
              {initials}
            </span>
          )}
        </span>

        <span className="ss-prof-meta">
          <span className="ss-prof-name" title={displayName}>
            {displayName}
          </span>
          {email ? (
            <span className="ss-prof-email" title={email}>
              {email}
            </span>
          ) : null}
        </span>

        <span className="ss-prof-caret" aria-hidden="true" />
      </button>

      <div
        id={menuId}
        role="menu"
        aria-labelledby={buttonId}
        className={`ss-prof-menu ${open ? "is-open" : ""}`}
      >
        <div className="ss-prof-menu-head">
          <div className="ss-prof-menu-head-title">{displayName}</div>
          {email ? <div className="ss-prof-menu-head-sub">{email}</div> : null}
        </div>

        <div className="ss-prof-menu-items" role="none">
          <button type="button" role="menuitem" className="ss-prof-item" onClick={() => go("/profile")}>
            Profile
          </button>
          <button type="button" role="menuitem" className="ss-prof-item" onClick={() => go("/settings")}>
            Settings
          </button>

          <div className="ss-prof-sep" role="separator" />

          <button
            type="button"
            role="menuitem"
            className="ss-prof-item ss-prof-item-danger"
            onClick={onSignOut}
            disabled={signingOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
