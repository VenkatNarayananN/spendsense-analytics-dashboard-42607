/**
 * Runtime config helpers for the SpendSense frontend.
 *
 * CRA note:
 * - Only REACT_APP_* variables are exposed to the frontend bundle.
 * - All values are strings at build time (or undefined), so parsing must be guarded.
 */

/**
 * PUBLIC_INTERFACE
 * Return a normalized backend base URL (no trailing slash). Empty string means "same origin".
 *
 * @returns {string}
 */
export function getBackendBaseUrl() {
  const raw = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_BASE;
  if (!raw) return "";
  return String(raw).trim().replace(/\/+$/, "");
}

/**
 * Safely parse a JSON value that may be undefined, empty, or invalid.
 *
 * @param {string | undefined} raw
 * @param {any} fallback
 * @returns {any}
 */
function safeJsonParse(raw, fallback) {
  if (raw == null) return fallback;

  const s = String(raw).trim();
  if (!s) return fallback;

  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

/**
 * PUBLIC_INTERFACE
 * Returns parsed feature flags from REACT_APP_FEATURE_FLAGS.
 * Always returns an object; never throws.
 *
 * @returns {Record<string, any>}
 */
export function getFeatureFlags() {
  const parsed = safeJsonParse(process.env.REACT_APP_FEATURE_FLAGS, {});
  return parsed && typeof parsed === "object" ? parsed : {};
}
