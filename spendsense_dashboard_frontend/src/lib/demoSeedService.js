import { getAuthedClient } from "./authedSupabase";
import { generateDemoTransactions } from "../mock/demoData";

/**
 * Demo seeding service for per-user Supabase data.
 *
 * Tables (public schema):
 * - transactions(user_id, merchant, category, amount, currency, transaction_date, status)
 * - alerts(user_id, type, message, severity, is_read)
 */

/**
 * Generate a small per-user seed to avoid all users seeing identical day-by-day data.
 * This is NOT security-sensitive; it's only for demo variation.
 */
function seedFromUserId(userId) {
  const s = String(userId || "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function toDateOnly(isoDateTime) {
  // Ensure YYYY-MM-DD
  const s = String(isoDateTime || "");
  if (s.length >= 10) return s.slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

/**
 * PUBLIC_INTERFACE
 * Fetch a user's transactions from Supabase.
 *
 * @param {string} userId
 * @returns {Promise<{ok:true, transactions:any[]} | {ok:false, error:Error}>}
 */
export async function fetchTransactions(userId) {
  /** Returns transactions ordered by date desc, then created_at desc. */
  const supabase = getAuthedClient();
  if (!supabase) return { ok: false, error: new Error("Supabase not configured") };
  if (!userId) return { ok: false, error: new Error("Missing userId") };

  const { data, error } = await supabase
    .from("transactions")
    .select("id, user_id, merchant, category, amount, currency, transaction_date, status, created_at")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error };
  return { ok: true, transactions: data ?? [] };
}

/**
 * PUBLIC_INTERFACE
 * Fetch a user's alerts from Supabase.
 *
 * @param {string} userId
 * @returns {Promise<{ok:true, alerts:any[]} | {ok:false, error:Error}>}
 */
export async function fetchAlerts(userId) {
  /** Returns alerts ordered by created_at desc. */
  const supabase = getAuthedClient();
  if (!supabase) return { ok: false, error: new Error("Supabase not configured") };
  if (!userId) return { ok: false, error: new Error("Missing userId") };

  const { data, error } = await supabase
    .from("alerts")
    .select("id, user_id, type, message, severity, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error };
  return { ok: true, alerts: data ?? [] };
}

function buildDemoAlerts() {
  const now = new Date();
  const iso = now.toISOString();
  return [
    {
      type: "Budget",
      message: "Heads up: you’re approaching 80% of your monthly budget. Review dining and shopping for quick wins.",
      severity: "warning",
      is_read: false,
      created_at: iso,
    },
    {
      type: "Security",
      message: "New sign-in detected. If this was you, you’re all set.",
      severity: "success",
      is_read: false,
      created_at: iso,
    },
    {
      type: "Large transaction",
      message: "Large transaction detected. Verify recent activity and flag anything unfamiliar.",
      severity: "error",
      is_read: false,
      created_at: iso,
    },
  ];
}

/**
 * PUBLIC_INTERFACE
 * Seed demo transactions + alerts for this user when DB is empty.
 *
 * Behavior:
 * - If tables already contain data, no-op.
 * - If insert fails, returns ok:false but callers should treat as non-fatal (UI must keep working).
 *
 * @param {string} userId
 * @returns {Promise<{ok:true, seeded:boolean, details?:any} | {ok:false, seeded:boolean, error:Error}>}
 */
export async function seedDemoDataIfEmpty(userId) {
  /** Seeds 10 transactions + 3 alerts per requirements when tables are empty for this user. */
  const supabase = getAuthedClient();
  if (!supabase) return { ok: false, seeded: false, error: new Error("Supabase not configured") };
  if (!userId) return { ok: false, seeded: false, error: new Error("Missing userId") };

  try {
    // Check if user already has data (fast, minimal payload)
    const [{ count: txCount, error: txCountErr }, { count: alCount, error: alCountErr }] = await Promise.all([
      supabase.from("transactions").select("*", { head: true, count: "exact" }).eq("user_id", userId),
      supabase.from("alerts").select("*", { head: true, count: "exact" }).eq("user_id", userId),
    ]);

    if (txCountErr) throw txCountErr;
    if (alCountErr) throw alCountErr;

    const hasData = (txCount || 0) > 0 || (alCount || 0) > 0;
    if (hasData) return { ok: true, seeded: false, details: { txCount: txCount || 0, alertCount: alCount || 0 } };

    const seed = seedFromUserId(userId);

    // Generate more demo tx then slice to exactly 10, ensuring variety.
    const demoTx = generateDemoTransactions({ seed, count: 18, days: 45, currency: "USD" }).slice(0, 10);

    const txRows = demoTx.map((t) => ({
      user_id: userId,
      merchant: t.merchant,
      category: t.category,
      amount: t.amount,
      currency: t.currency,
      transaction_date: toDateOnly(t.date),
      status: "posted",
      created_at: new Date().toISOString(),
    }));

    const alertRows = buildDemoAlerts().map((a) => ({
      user_id: userId,
      type: a.type,
      message: a.message,
      severity: a.severity,
      is_read: a.is_read,
      created_at: a.created_at,
    }));

    const [{ error: txInsertErr }, { error: alInsertErr }] = await Promise.all([
      supabase.from("transactions").insert(txRows),
      supabase.from("alerts").insert(alertRows),
    ]);

    if (txInsertErr) throw txInsertErr;
    if (alInsertErr) throw alInsertErr;

    return { ok: true, seeded: true, details: { transactions: txRows.length, alerts: alertRows.length } };
  } catch (e) {
    return { ok: false, seeded: false, error: e };
  }
}

function mapTxRowToUi(row) {
  return {
    id: row.id,
    date: row.transaction_date,
    merchant: row.merchant,
    category: row.category,
    amount: Number(row.amount ?? 0),
    currency: row.currency || "USD",
    status: row.status || "posted",
  };
}

function mapAlertRowToUi(row) {
  const createdAt = row.created_at ? String(row.created_at) : "";
  const date = createdAt ? createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
  return {
    id: row.id,
    type: row.type,
    severity: row.severity || "info",
    date,
    status: row.is_read ? "resolved" : "open",
    title: row.type || "Alert",
    description: row.message || "",
    is_read: Boolean(row.is_read),
  };
}

/**
 * PUBLIC_INTERFACE
 * Convenience: fetch + map transactions for UI components.
 *
 * @param {string} userId
 * @returns {Promise<{ok:true, transactions:any[]} | {ok:false, error:Error}>}
 */
export async function fetchTransactionsForUi(userId) {
  /** Maps DB rows to the UI's existing transactions shape. */
  const res = await fetchTransactions(userId);
  if (!res.ok) return res;
  return { ok: true, transactions: (res.transactions || []).map(mapTxRowToUi) };
}

/**
 * PUBLIC_INTERFACE
 * Convenience: fetch + map alerts for UI components.
 *
 * @param {string} userId
 * @returns {Promise<{ok:true, alerts:any[]} | {ok:false, error:Error}>}
 */
export async function fetchAlertsForUi(userId) {
  /** Maps DB rows to the UI's existing alerts shape (derivedAlerts-compatible). */
  const res = await fetchAlerts(userId);
  if (!res.ok) return res;
  return { ok: true, alerts: (res.alerts || []).map(mapAlertRowToUi) };
}
