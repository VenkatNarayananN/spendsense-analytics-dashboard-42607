import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * URL-backed filter state helpers (no external deps).
 */

function parseNumberOrEmpty(v) {
  if (v == null) return "";
  const s = String(v).trim();
  if (!s) return "";
  const n = Number(s);
  return Number.isFinite(n) ? String(n) : "";
}

function parseString(v) {
  if (v == null) return "";
  return String(v);
}

function pick(params, key, fallback = "") {
  const v = params.get(key);
  return v == null ? fallback : v;
}

// PUBLIC_INTERFACE
export function useDebouncedValue(value, delayMs = 300) {
  /** Returns a debounced version of `value` after `delayMs`. */
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

// PUBLIC_INTERFACE
export function useURLQueryState(schema) {
  /**
   * Hook to sync a plain object state into URL query params.
   *
   * schema: {
   *   key: { default: "", parse?: (string)=>any, serialize?: (any)=>string, omitIfDefault?: boolean }
   * }
   *
   * Returns: [state, setState, resetState]
   */
  const location = useLocation();
  const navigate = useNavigate();

  const defaults = useMemo(() => {
    const d = {};
    Object.keys(schema).forEach((k) => {
      d[k] = schema[k].default;
    });
    return d;
  }, [schema]);

  const readFromURL = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const next = { ...defaults };

    Object.keys(schema).forEach((k) => {
      const raw = pick(params, k, "");
      if (raw === "") return;
      const parse = schema[k].parse || parseString;
      next[k] = parse(raw);
    });

    return next;
  }, [location.search, schema, defaults]);

  const [state, setState] = useState(readFromURL);

  // Keep local state in sync if location.search changes externally
  useEffect(() => {
    setState(readFromURL);
  }, [readFromURL]);

  const lastWrittenRef = useRef("");

  const writeToURL = (nextState) => {
    const params = new URLSearchParams(location.search);

    Object.keys(schema).forEach((k) => {
      const def = schema[k].default;
      const serialize = schema[k].serialize || ((x) => String(x));
      const omitIfDefault = schema[k].omitIfDefault !== false; // default true

      const val = nextState[k];

      const isDefault = val === def || (val === "" && (def === "" || def == null));
      if (omitIfDefault && isDefault) {
        params.delete(k);
      } else {
        params.set(k, serialize(val));
      }
    });

    const nextSearch = params.toString() ? `?${params.toString()}` : "";
    if (nextSearch === lastWrittenRef.current) return;

    lastWrittenRef.current = nextSearch;
    navigate(`${location.pathname}${nextSearch}`, { replace: true });
  };

  const resetState = () => {
    setState(defaults);
    writeToURL(defaults);
  };

  return [state, (updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writeToURL(next);
      return next;
    });
  }, resetState];
}

// PUBLIC_INTERFACE
export const parsers = {
  /** Common parse helpers for filter schemas. */
  string: parseString,
  numberOrEmpty: parseNumberOrEmpty,
};
