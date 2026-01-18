/**
 * Frontend FX client and conversion helpers.
 *
 * Uses the backend endpoint:
 *   GET /api/fx/latest?base=USD
 *
 * Backend base URL can be configured via:
 * - REACT_APP_BACKEND_URL (preferred)
 * If not set, we fall back to relative requests (useful in same-origin deployments).
 */

import { getBackendBaseUrl } from "./runtimeConfig";

// PUBLIC_INTERFACE
export async function fetchLatestFxRates({ base = "USD" } = {}) {
  /** Fetch latest FX rates from backend. Returns { base, rates, timestamp }. */
  const b = String(base || "USD").trim().toUpperCase() || "USD";
  const url = `${getBackendBaseUrl()}/api/fx/latest?base=${encodeURIComponent(b)}`;

  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `FX request failed (${res.status}).`;
    const err = new Error(message);
    err.httpStatus = res.status;
    throw err;
  }

  if (!data || typeof data !== "object" || !data.rates || typeof data.rates !== "object") {
    throw new Error("FX response format was invalid.");
  }

  return data;
}

// PUBLIC_INTERFACE
export function getFxRate(rates, currency, base) {
  /** Returns numeric rate for `currency` given rates object and base; null if unavailable. */
  if (!rates || typeof rates !== "object") return null;
  const c = String(currency || "").trim().toUpperCase();
  const b = String(base || "").trim().toUpperCase();
  if (!c || !b) return null;
  if (c === b) return 1;
  const v = Number(rates[c]);
  return Number.isFinite(v) ? v : null;
}

// PUBLIC_INTERFACE
export function convertAmount(amountUsd, toCurrency, rates, base) {
  /**
   * Converts a numeric amount expressed in `base` into `toCurrency` using rates.
   * For Dashboard we treat the "source" numbers as base (typically USD) and convert to selected currency.
   */
  const n = Number(amountUsd);
  if (!Number.isFinite(n)) return 0;

  const rate = getFxRate(rates, toCurrency, base);
  if (!rate) return n; // graceful fallback: show original value if we can't convert

  return n * rate;
}

// PUBLIC_INTERFACE
export function convertSeries(data, toCurrency, rates, base) {
  /** Convert chart series: [{label,value}] -> same labels with converted values. */
  if (!Array.isArray(data)) return [];
  return data.map((d) => ({
    ...d,
    value: convertAmount(d?.value, toCurrency, rates, base),
  }));
}
