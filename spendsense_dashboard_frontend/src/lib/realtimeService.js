import { getAuthedClient } from "./authedSupabase";

/**
 * Realtime subscriptions for SpendSense tables.
 *
 * Notes:
 * - Uses supabase-js Realtime Channels.
 * - Subscriptions are scoped by `user_id` in the filter string; this requires `user_id` to exist on rows.
 * - Callers must hold onto the returned channel and unsubscribe on cleanup.
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
      });

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
      });

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

