import { getAuthedClient } from "./authedSupabase";

/**
 * Realtime subscriptions for SpendSense tables.
 *
 * Supabase integration points:
 * - Uses supabase-js Realtime Channels (postgres_changes).
 * - Subscriptions are scoped by `user_id` in the filter string; this requires `user_id` to exist on rows.
 * - The Supabase project must have Realtime enabled for the relevant tables.
 * - Callers must hold onto the returned channel and unsubscribe on cleanup.
 *
 * RLS note:
 * Realtime delivery is still subject to auth context; ensure the client is authenticated and the
 * tables/policies are configured according to `assets/supabase.md`.
 */

/**
 * PUBLIC_INTERFACE
 * Subscribe to realtime changes on the `transactions` table for a given user.
 *
 * @param {string} userId
 * @param {(payload:any)=>void} onChange Called for INSERT/UPDATE/DELETE events.
 * @returns {{ok:true, channel:any} | {ok:false, error:Error}}
 */
export function subscribeToTransactionsRealtime(userId, onChange) {
  const supabase = getAuthedClient();
  if (!supabase) return { ok: false, error: new Error("Supabase not configured") };
  if (!userId) return { ok: false, error: new Error("Missing userId") };

  try {
    const channel = supabase
      .channel(`realtime:transactions:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
        (payload) => {
          try {
            onChange?.(payload);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[realtime] transactions onChange error:", e);
          }
        }
      )
      .subscribe((status) => {
        // eslint-disable-next-line no-console
        console.info("[realtime] transactions subscription status:", status);
        // Expose status on the channel so UI can read it without deep-coupling to supabase-js internals.
        // This is intentionally "best effort" and kept stable for UI purposes only.
        channel.__ss_status = status;
      });

    // Initialize immediately as "connecting" until callback fires.
    channel.__ss_status = "SUBSCRIBING";

    return { ok: true, channel };
  } catch (e) {
    return { ok: false, error: e };
  }
}

/**
 * PUBLIC_INTERFACE
 * Subscribe to realtime changes on the `alerts` table for a given user.
 *
 * @param {string} userId
 * @param {(payload:any)=>void} onChange Called for INSERT/UPDATE/DELETE events.
 * @returns {{ok:true, channel:any} | {ok:false, error:Error}}
 */
export function subscribeToAlertsRealtime(userId, onChange) {
  const supabase = getAuthedClient();
  if (!supabase) return { ok: false, error: new Error("Supabase not configured") };
  if (!userId) return { ok: false, error: new Error("Missing userId") };

  try {
    const channel = supabase
      .channel(`realtime:alerts:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts", filter: `user_id=eq.${userId}` },
        (payload) => {
          try {
            onChange?.(payload);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[realtime] alerts onChange error:", e);
          }
        }
      )
      .subscribe((status) => {
        // eslint-disable-next-line no-console
        console.info("[realtime] alerts subscription status:", status);
        channel.__ss_status = status;
      });

    channel.__ss_status = "SUBSCRIBING";

    return { ok: true, channel };
  } catch (e) {
    return { ok: false, error: e };
  }
}

/**
 * PUBLIC_INTERFACE
 * Unsubscribe a previously created realtime channel.
 *
 * @param {any} channel Supabase RealtimeChannel
 * @returns {Promise<void>}
 */
export async function unsubscribeRealtimeChannel(channel) {
  const supabase = getAuthedClient();
  if (!supabase) return;
  if (!channel) return;

  try {
    await supabase.removeChannel(channel);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[realtime] Failed to remove channel:", e);
  }
}

