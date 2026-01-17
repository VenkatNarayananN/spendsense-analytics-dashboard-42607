import { getAuthedClient } from "./authedSupabase";

/**
 * Profile service helpers for Supabase-backed profile CRUD + avatar storage.
 *
 * Supabase integration points:
 * - Database reads/writes use PostgREST via `supabase.from("profiles")`.
 * - Avatar upload uses Supabase Storage via `supabase.storage.from("avatars")`.
 *
 * Assumptions (must match Supabase configuration):
 * - `profiles` table has primary key `id` referencing `auth.users(id)`
 * - fields: full_name, phone, avatar_url
 * - Storage bucket: `avatars`
 *
 * Policy/RLS expectation:
 * - `profiles` table uses RLS so users can only access their own row (id = auth.uid()).
 * - `storage.objects` policies restrict access to files under `avatars/{auth.uid()}/...`.
 *   See `assets/supabase.md` for the exact SQL.
 */

/**
 * PUBLIC_INTERFACE
 * Fetch the current user's profile row from Supabase `profiles`.
 *
 * @param {string} userId Supabase auth user id.
 * @returns {Promise<{ok: true, profile: {id: string, full_name: string|null, phone: string|null, avatar_url: string|null} | null} | {ok: false, error: Error}>}
 */
export async function fetchProfile(userId) {
  const supabase = getAuthedClient();
  if (!supabase) {
    return { ok: false, error: new Error("Supabase not configured") };
  }
  if (!userId) return { ok: false, error: new Error("Missing userId") };

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { ok: false, error };
  return { ok: true, profile: data ?? null };
}

/**
 * PUBLIC_INTERFACE
 * Upsert the current user's profile row in Supabase `profiles`.
 *
 * @param {string} userId Supabase auth user id.
 * @param {{ full_name?: string|null, phone?: string|null, avatar_url?: string|null }} updates
 * @returns {Promise<{ok: true, profile: any} | {ok: false, error: Error}>}
 */
export async function upsertProfile(userId, updates) {
  const supabase = getAuthedClient();
  if (!supabase) return { ok: false, error: new Error("Supabase not configured") };
  if (!userId) return { ok: false, error: new Error("Missing userId") };

  const payload = {
    id: userId,
    full_name: updates?.full_name ?? null,
    phone: updates?.phone ?? null,
    avatar_url: updates?.avatar_url ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("id, full_name, phone, avatar_url")
    .single();

  if (error) return { ok: false, error };
  return { ok: true, profile: data };
}

function extFromFilename(name) {
  const s = String(name || "").toLowerCase();
  const m = s.match(/\.([a-z0-9]{2,8})$/);
  const ext = m ? m[1] : "";
  // Keep conservative to avoid weird content-types; default to png
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return ext === "jpeg" ? "jpg" : ext;
  return "png";
}

/**
 * PUBLIC_INTERFACE
 * Upload an avatar image file to Supabase Storage bucket `avatars` and return a public URL (or signed URL if public is disabled).
 *
 * Path format required: `avatars/{userId}/{timestamp}.<ext>`
 *
 * Graceful behavior:
 * - If Storage is unavailable / policies deny access, returns ok:false with a helpful error.
 *
 * @param {string} userId Supabase auth user id.
 * @param {File} file Browser File object.
 * @returns {Promise<{ok:true, publicUrl: string, path: string} | {ok:false, error: Error}>}
 */
export async function uploadAvatar(userId, file) {
  const supabase = getAuthedClient();
  if (!supabase) return { ok: false, error: new Error("Supabase not configured") };
  if (!userId) return { ok: false, error: new Error("Missing userId") };
  if (!file) return { ok: false, error: new Error("Missing file") };

  const ext = extFromFilename(file.name);
  const ts = Date.now();
  const path = `${userId}/${ts}.${ext}`;

  // Upload (overwrite disabled by default; we create unique timestamped filenames)
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (uploadError) return { ok: false, error: uploadError };

  // Prefer public URL (works when bucket is public); otherwise try signed URL as fallback.
  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = pub?.publicUrl;

  if (publicUrl) return { ok: true, publicUrl, path };

  // Fallback to signed url (requires appropriate policy + bucket not necessarily public)
  const { data: signed, error: signedError } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
  if (signedError) return { ok: false, error: signedError };
  return { ok: true, publicUrl: signed?.signedUrl || "", path };
}

/**
 * PUBLIC_INTERFACE
 * Small helper to map Supabase `profiles` row to the app's local profile model used by the topbar.
 *
 * @param {{email?: string, full_name?: string|null, avatar_url?: string|null, phone?: string|null}} input
 * @returns {{email: string, name: string, avatarUrl: string, phone: string}}
 */
export function mapSupabaseProfileToLocal(input) {
  return {
    email: input?.email || "",
    name: input?.full_name || "",
    phone: input?.phone || "",
    avatarUrl: input?.avatar_url || "",
  };
}

