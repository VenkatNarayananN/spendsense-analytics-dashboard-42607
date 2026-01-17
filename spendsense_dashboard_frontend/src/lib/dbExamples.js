import { getAuthedClient } from "./authedSupabase";

/**
 * PUBLIC_INTERFACE
 * Example: fetch current user's profile row from a `profiles` table.
 *
 * Assumptions (typical Supabase):
 * - `profiles` has a `id` UUID column matching `auth.users.id`
 * - RLS policies allow authenticated users to select their own profile
 *
 * @param {string} userId
 * @returns {Promise<{profile: any | null, error: Error | null}>}
 */
export async function fetchMyProfile(userId) {
  const supabase = getAuthedClient();
  if (!supabase) {
    // Demo mode: no DB. Keep app functional.
    return { profile: null, error: null };
  }

  if (!userId) return { profile: null, error: new Error("userId is required") };

  // Keep it simple and defensive.
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { profile: null, error };
  return { profile: data ?? null, error: null };
}

