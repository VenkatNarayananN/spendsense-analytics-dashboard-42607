import { getAuthedClient } from "./authedSupabase";

function toDateOnly(value) {
  const s = String(value || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.length >= 10) return s.slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

/**
 * PUBLIC_INTERFACE
 * Insert a new transaction for the current user.
 *
 * Expects a `transactions` table with columns:
 * - user_id, merchant, category, amount, currency, transaction_date, status
 *
 * @param {string} userId
 * @param {{merchant:string, category:string, amount:number|string, currency:string, date:string, status?:string}} input
 * @returns {Promise<{ok:true, transaction:any} | {ok:false, error:Error}>}
 */
export async function createTransaction(userId, input) {
  const supabase = getAuthedClient();
  if (!supabase) return { ok: false, error: new Error("Supabase not configured") };
  if (!userId) return { ok: false, error: new Error("Missing userId") };

  const merchant = String(input?.merchant || "").trim();
  const category = String(input?.category || "").trim();
  const currency = String(input?.currency || "USD").trim() || "USD";
  const status = String(input?.status || "posted").trim() || "posted";
  const amount = Number(input?.amount);

  if (!merchant) return { ok: false, error: new Error("Merchant is required") };
  if (!category) return { ok: false, error: new Error("Category is required") };
  if (!Number.isFinite(amount)) return { ok: false, error: new Error("Amount must be a valid number") };

  const row = {
    user_id: userId,
    merchant,
    category,
    amount,
    currency,
    transaction_date: toDateOnly(input?.date),
    status,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("transactions")
    .insert(row)
    .select("id, user_id, merchant, category, amount, currency, transaction_date, status, created_at")
    .single();

  if (error) return { ok: false, error };
  return { ok: true, transaction: data };
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
 * Mark an alert as read/resolved.
 *
 * Expects `alerts` table with `is_read` boolean column.
 *
 * @param {string} userId
 * @param {string|number} alertId
 * @returns {Promise<{ok:true, alert:any} | {ok:false, error:Error}>}
 */
export async function dismissAlert(userId, alertId) {
  const supabase = getAuthedClient();
  if (!supabase) return { ok: false, error: new Error("Supabase not configured") };
  if (!userId) return { ok: false, error: new Error("Missing userId") };
  if (!alertId) return { ok: false, error: new Error("Missing alertId") };

  const { data, error } = await supabase
    .from("alerts")
    .update({ is_read: true })
    .eq("id", alertId)
    .eq("user_id", userId)
    .select("id, user_id, type, message, severity, is_read, created_at")
    .single();

  if (error) return { ok: false, error };
  return { ok: true, alert: mapAlertRowToUi(data) };
}

