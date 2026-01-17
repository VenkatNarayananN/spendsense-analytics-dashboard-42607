import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfiguredFn } from "../lib/supabaseClient";
import { seedDemoDataIfEmpty, fetchAlertsForUi, fetchTransactionsForUi, generateSampleData } from "../lib/demoSeedService";
import { useAuth } from "../auth/AuthProvider";
import { generateDemoTransactions, deriveAlerts as deriveAlertsFromTransactions } from "../mock/demoData";
import { usePreferences } from "./preferences";
import {
  subscribeToAlertsRealtime,
  subscribeToTransactionsRealtime,
  unsubscribeRealtimeChannel,
} from "../lib/realtimeService";
import { createTransaction as createTransactionDb, dismissAlert as dismissAlertDb } from "../lib/transactionsAlertsService";

/**
 * AppDataContext:
 * - Centralizes transactions + alerts (Supabase-backed).
 * - Seeds demo data per user on first login/empty DB.
 * - Provides refresh methods for pages.
 *
 * Supabase integration points:
 * - CRUD is performed via `src/lib/transactionsAlertsService.js` (PostgREST calls).
 * - Initial read + seeding are performed via `src/lib/demoSeedService.js`.
 * - Realtime subscriptions are established via `src/lib/realtimeService.js`.
 *
 * RLS expectation:
 * The database must enforce row ownership such that the authenticated user can only
 * read/write rows where `user_id = auth.uid()` (see `assets/supabase.md`).
 */

const AppDataContext = createContext(null);

function warnNonFatal(label, error) {
  // eslint-disable-next-line no-console
  console.warn(`[app-data] ${label}`, error?.message || error);
}

/**
 * PUBLIC_INTERFACE
 * Provider that loads and refreshes the user's Supabase data.
 */
export function AppDataProvider({ children }) {
  /** Provider that ensures pages can render with either Supabase data or safe fallbacks. */
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { prefs } = usePreferences();

  const supabaseConfigured = isSupabaseConfiguredFn();
  const userId = user?.id || null;

  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [loadingData, setLoadingData] = useState(Boolean(supabaseConfigured));
  const [seedingState, setSeedingState] = useState({ status: "idle", message: "" }); // idle|running|done|failed
  const [dataError, setDataError] = useState("");

  // Track last userId to reset state when user changes.
  const lastUserIdRef = useRef(null);

  const loadAll = useCallback(
    async ({ attemptSeed = true } = {}) => {
      if (!supabaseConfigured || !isAuthenticated || !userId) {
        // In demo mode or unauthenticated, fall back to local demo generator so UI is never blank.
        const demoTx = generateDemoTransactions({ seed: 42, count: 54, currency: prefs.currency });
        setTransactions(demoTx);
        setAlerts(deriveAlertsFromTransactions(demoTx, { monthlyBudget: prefs.monthlyBudget, alertsEnabled: prefs.alertsEnabled }));
        setLoadingData(false);
        setDataError("");
        setSeedingState({ status: "idle", message: "" });
        return;
      }

      setLoadingData(true);
      setDataError("");

      // 1) Optionally attempt per-user seeding if empty (non-fatal on failure).
      if (attemptSeed) {
        setSeedingState({ status: "running", message: "Preparing your demo data…" });
        const seedRes = await seedDemoDataIfEmpty(userId);
        if (!seedRes.ok) {
          warnNonFatal("Demo seeding failed (non-fatal):", seedRes.error);
          setSeedingState({
            status: "failed",
            message: "We couldn’t seed demo data right now. You can continue; data may appear once connectivity/policies are fixed.",
          });
        } else if (seedRes.seeded) {
          setSeedingState({ status: "done", message: "Demo data added." });
        } else {
          setSeedingState({ status: "done", message: "" });
        }
      }

      // 2) Fetch data for UI
      const [txRes, alRes] = await Promise.all([fetchTransactionsForUi(userId), fetchAlertsForUi(userId)]);

      if (!txRes.ok) {
        warnNonFatal("Failed to fetch transactions:", txRes.error);
        setDataError((prev) => prev || "Some data could not be loaded (transactions).");
      }
      if (!alRes.ok) {
        warnNonFatal("Failed to fetch alerts:", alRes.error);
        setDataError((prev) => prev || "Some data could not be loaded (alerts).");
      }

      // 3) Ensure we always set arrays (avoid UI crashes)
      const nextTx = txRes.ok ? txRes.transactions : [];
      const nextAlerts = alRes.ok ? alRes.alerts : [];

      // 4) If both are empty, provide a client-side fallback to avoid blank pages.
      // This covers cases where RLS/policies block reads temporarily.
      if (nextTx.length === 0 && nextAlerts.length === 0) {
        const demoTx = generateDemoTransactions({ seed: 42, count: 54, currency: prefs.currency });
        setTransactions(demoTx);
        setAlerts(deriveAlertsFromTransactions(demoTx, { monthlyBudget: prefs.monthlyBudget, alertsEnabled: prefs.alertsEnabled }));
      } else {
        setTransactions(nextTx);
        setAlerts(nextAlerts);
      }

      setLoadingData(false);
    },
    [isAuthenticated, prefs.alertsEnabled, prefs.currency, prefs.monthlyBudget, supabaseConfigured, userId]
  );

  // Auto-load on auth resolution and user change.
  useEffect(() => {
    if (authLoading) return;

    if (lastUserIdRef.current !== userId) {
      lastUserIdRef.current = userId;
      // Reset state quickly to avoid showing previous user's data.
      setTransactions([]);
      setAlerts([]);
      setDataError("");
      setSeedingState({ status: "idle", message: "" });
    }

    // Load once per login/user change.
    loadAll({ attemptSeed: true });
  }, [authLoading, loadAll, userId]);

  const refreshTransactions = useCallback(async () => {
    // Keep it simple: reload all, but skip seed to reduce noise.
    await loadAll({ attemptSeed: false });
  }, [loadAll]);

  const refreshAlerts = useCallback(async () => {
    await loadAll({ attemptSeed: false });
  }, [loadAll]);

  const refreshAll = useCallback(async () => {
    await loadAll({ attemptSeed: false });
  }, [loadAll]);

  const createTransaction = useCallback(
    async (input) => {
      if (!supabaseConfigured || !isAuthenticated || !userId) {
        return { ok: false, error: new Error("Not authenticated or Supabase not configured") };
      }
      const res = await createTransactionDb(userId, input);
      if (!res.ok) return res;

      // Optimistic local update (realtime will also deliver it; we keep this to feel instant).
      setTransactions((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        const row = res.transaction;
        next.unshift({
          id: row.id,
          date: row.transaction_date,
          merchant: row.merchant,
          category: row.category,
          amount: Number(row.amount ?? 0),
          currency: row.currency || "USD",
          status: row.status || "posted",
        });
        return next;
      });

      return res;
    },
    [isAuthenticated, supabaseConfigured, userId]
  );

  const dismissAlert = useCallback(
    async (alertId) => {
      if (!supabaseConfigured || !isAuthenticated || !userId) {
        return { ok: false, error: new Error("Not authenticated or Supabase not configured") };
      }
      const res = await dismissAlertDb(userId, alertId);
      if (!res.ok) return res;

      // Optimistic local update; realtime will reconcile too.
      setAlerts((prev) =>
        Array.isArray(prev) ? prev.map((a) => (a.id === alertId ? { ...a, status: "resolved", is_read: true } : a)) : prev
      );

      return res;
    },
    [isAuthenticated, supabaseConfigured, userId]
  );

  const generateSampleDataAction = useCallback(
    async (options = {}) => {
      if (!supabaseConfigured || !isAuthenticated || !userId) {
        return { ok: false, error: new Error("Not authenticated or Supabase not configured") };
      }

      setSeedingState({ status: "running", message: "Generating sample data…" });

      const res = await generateSampleData(userId, { currency: prefs.currency, ...options });

      if (!res.ok) {
        warnNonFatal("Generate sample data failed (non-fatal):", res.error);
        setSeedingState({
          status: "failed",
          message: "Could not generate sample data. Check Supabase policies (RLS) and try again.",
        });
        return res;
      }

      setSeedingState({ status: "done", message: `Sample data added (${res.details?.transactions || 0} tx, ${res.details?.alerts || 0} alerts).` });

      // Refresh lists so the UI updates immediately.
      await loadAll({ attemptSeed: false });
      return res;
    },
    [isAuthenticated, loadAll, prefs.currency, supabaseConfigured, userId]
  );

  // Realtime subscriptions: keep lists in sync while the user is authenticated.
  useEffect(() => {
    if (!supabaseConfigured || !isAuthenticated || !userId) return () => {};

    let txChannel = null;
    let alertChannel = null;
    let cancelled = false;

    const txSub = subscribeToTransactionsRealtime(userId, () => {
      // Debounced by nature of the refresh call; simplest reliable approach is to re-fetch.
      if (cancelled) return;
      refreshTransactions();
    });
    if (txSub.ok) txChannel = txSub.channel;

    const alSub = subscribeToAlertsRealtime(userId, () => {
      if (cancelled) return;
      refreshAlerts();
    });
    if (alSub.ok) alertChannel = alSub.channel;

    return () => {
      cancelled = true;
      unsubscribeRealtimeChannel(txChannel);
      unsubscribeRealtimeChannel(alertChannel);
    };
  }, [isAuthenticated, refreshAlerts, refreshTransactions, supabaseConfigured, userId]);

  const value = useMemo(
    () => ({
      transactions,
      alerts,
      loadingData,
      dataError,
      seedingState,
      refreshTransactions,
      refreshAlerts,
      refreshAll,
      createTransaction,
      dismissAlert,
      generateSampleDataAction,
    }),
    [
      alerts,
      dataError,
      loadingData,
      refreshAlerts,
      refreshAll,
      refreshTransactions,
      seedingState,
      transactions,
      createTransaction,
      dismissAlert,
      generateSampleDataAction,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

/**
 * PUBLIC_INTERFACE
 * Hook to access app data (transactions, alerts) + refresh methods.
 */
export function useAppData() {
  /** Hook to access the AppDataContext. */
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within an AppDataProvider");
  return ctx;
}
