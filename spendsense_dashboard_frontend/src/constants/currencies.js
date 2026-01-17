const CURRENCIES = [
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "CNY", label: "CNY — Chinese Yuan" },
];

/**
 * Backward-compatibility mapping for previously supported values.
 * If older builds stored unsupported currencies, keep the selection working by
 * mapping to the closest supported ISO code.
 */
const LEGACY_CURRENCY_MAP = {
  // Previously offered in SettingsPage
  AUD: "USD",
};

// PUBLIC_INTERFACE
export function getCurrencies() {
  /** Return supported currency options as an array of {code,label}. */
  return CURRENCIES.slice();
}

// PUBLIC_INTERFACE
export function isSupportedCurrency(code) {
  /** True if `code` is one of the supported ISO currency codes. */
  return CURRENCIES.some((c) => c.code === code);
}

// PUBLIC_INTERFACE
export function normalizeCurrency(code, fallback = "USD") {
  /**
   * Normalize a possibly-legacy currency code to a supported ISO currency code.
   * Falls back to `fallback` (default USD) when unknown.
   */
  const raw = String(code || "").trim().toUpperCase();
  const mapped = LEGACY_CURRENCY_MAP[raw] || raw;
  return isSupportedCurrency(mapped) ? mapped : fallback;
}

// PUBLIC_INTERFACE
export function getCurrencyLabel(code) {
  /** Return the friendly label for a currency code, or the code itself if unknown. */
  const normalized = normalizeCurrency(code);
  return CURRENCIES.find((c) => c.code === normalized)?.label || normalized;
}
