import React, { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import { Button, Card, Chip, PageHeader } from "../components/ui";
import { IconSearch } from "../components/icons";
import { EmptyState, FilterBar } from "../components/ux";
import { parsers, useDebouncedValue, useURLQueryState } from "../components/urlState";
import { usePreferences } from "../state/preferences";
import { useAppData } from "../state/appData";

function fmtCurrency(n, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `$${Number(n || 0).toFixed(2)}`;
  }
}

function clampAmountString(v) {
  // Keep user input flexible; just trim spaces
  return String(v ?? "").trim();
}

// PUBLIC_INTERFACE
export default function TransactionsPage() {
  /** Searchable + filterable transactions table with realistic demo data and URL-synced filters. */
  const { prefs } = usePreferences();
  const { transactions: ctxTransactions, loadingData, dataError, seedingState, refreshTransactions, createTransaction } = useAppData();

  const [newTx, setNewTx] = useState(() => ({
    date: new Date().toISOString().slice(0, 10),
    merchant: "",
    category: "",
    amount: "",
    currency: prefs.currency || "USD",
  }));
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    // Keep currency aligned with preferences unless user already typed one.
    setNewTx((p) => ({ ...p, currency: p.currency || prefs.currency || "USD" }));
  }, [prefs.currency]);

  // URL-synced filters
  const [filters, setFilters, resetFilters] = useURLQueryState({
    q: { default: "", parse: parsers.string, serialize: (v) => String(v || "").trim() },
    category: { default: "All", parse: parsers.string, serialize: (v) => String(v || "All") },
    min: { default: "", parse: parsers.numberOrEmpty, serialize: (v) => String(v || "") },
    max: { default: "", parse: parsers.numberOrEmpty, serialize: (v) => String(v || "") },
    from: { default: "", parse: parsers.string, serialize: (v) => String(v || "") },
    to: { default: "", parse: parsers.string, serialize: (v) => String(v || "") },
  });

  // Debounce only the search query (better typing feel).
  const [qDraft, setQDraft] = useState(filters.q);
  useEffect(() => setQDraft(filters.q), [filters.q]);
  const qDebounced = useDebouncedValue(qDraft, 250);

  useEffect(() => {
    // Sync debounced query back into URL/state
    setFilters((prev) => ({ ...prev, q: qDebounced }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced]);

  // Loading: rely on shared context (seed + fetch). Keep bounded by context behavior.
  const isLoading = Boolean(loadingData);

  const all = useMemo(() => {
    // Context already provides a safe fallback when Supabase is unavailable or empty.
    return Array.isArray(ctxTransactions) ? ctxTransactions : [];
  }, [ctxTransactions]);

  const categories = useMemo(() => ["All", ...Array.from(new Set(all.map((t) => t.category)))], [all]);

  const rows = useMemo(() => {
    const qLower = String(filters.q || "").trim().toLowerCase();

    return all.filter((t) => {
      if (qLower) {
        const text = `${t.merchant} ${t.category} ${t.date} ${t.currency}`.toLowerCase();
        if (!text.includes(qLower)) return false;
      }

      if (filters.category !== "All" && t.category !== filters.category) return false;

      if (filters.from && t.date < filters.from) return false;
      if (filters.to && t.date > filters.to) return false;

      const min = filters.min === "" ? null : Number(filters.min);
      const max = filters.max === "" ? null : Number(filters.max);
      if (min != null && t.amount < min) return false;
      if (max != null && t.amount > max) return false;

      return true;
    });
  }, [all, filters]);

  const columns = useMemo(
    () => [
      { key: "date", header: "Date" },
      { key: "merchant", header: "Merchant" },
      { key: "category", header: "Category" },
      {
        key: "amount",
        header: "Amount",
        render: (r) => <span style={{ fontWeight: 900 }}>{fmtCurrency(r.amount, r.currency)}</span>,
      },
      { key: "currency", header: "Currency" },
    ],
    []
  );

  const reset = () => {
    setQDraft("");
    resetFilters();
  };

  const desktopRightControls = (
    <>
      <label className="ss-muted" style={{ fontSize: 12 }}>
        From
        <input
          className="ss-input"
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
          aria-label="Date from"
        />
      </label>
      <label className="ss-muted" style={{ fontSize: 12 }}>
        To
        <input
          className="ss-input"
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
          aria-label="Date to"
        />
      </label>
      <label className="ss-muted" style={{ fontSize: 12 }}>
        Min
        <input
          className="ss-input"
          inputMode="decimal"
          value={filters.min}
          onChange={(e) => setFilters((p) => ({ ...p, min: clampAmountString(e.target.value) }))}
          placeholder="0"
          aria-label="Minimum amount"
        />
      </label>
      <label className="ss-muted" style={{ fontSize: 12 }}>
        Max
        <input
          className="ss-input"
          inputMode="decimal"
          value={filters.max}
          onChange={(e) => setFilters((p) => ({ ...p, max: clampAmountString(e.target.value) }))}
          placeholder="999"
          aria-label="Maximum amount"
        />
      </label>
    </>
  );

  return (
    <main role="main" aria-label="Transactions">
      <PageHeader
        title="Transactions"
        description="Search, filter, and review your transactions."
        right={<Chip tone={prefs.demoMode ? "secondary" : "primary"}>{prefs.demoMode ? "Demo mode" : "Live"}</Chip>}
      />

      <FilterBar
        title="Transaction filters"
        onReset={reset}
        left={
          <>
            <div style={{ position: "relative", minWidth: 260, flex: "1 1 320px" }}>
              <span style={{ position: "absolute", left: 12, top: 11, color: "rgba(255,255,255,0.55)" }}>
                <IconSearch />
              </span>
              <input
                className="ss-input"
                style={{ paddingLeft: 40, minWidth: 280 }}
                value={qDraft}
                onChange={(e) => setQDraft(e.target.value)}
                placeholder="Search merchant or category…"
                aria-label="Search transactions"
              />
            </div>

            <select
              className="ss-select"
              value={filters.category}
              onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
              aria-label="Filter by category"
              style={{ minWidth: 180 }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </>
        }
        right={desktopRightControls}
        mobileDrawerContent={
          <>
            {desktopRightControls}
            <div className="ss-muted" style={{ fontSize: 12 }}>
              Tip: Filters persist in the URL so you can share your view.
            </div>
          </>
        }
      />

      <div style={{ height: 12 }} />

      <div className="ss-grid ss-grid-2" style={{ alignItems: "start" }}>
        <Card title="New transaction" caption="Add a transaction (saved to Supabase when Live).">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setCreateError("");
              if (!newTx.merchant.trim() || !newTx.category.trim() || !String(newTx.amount).trim()) {
                setCreateError("Merchant, category, and amount are required.");
                return;
              }

              setCreating(true);
              try {
                const res = await createTransaction({
                  date: newTx.date,
                  merchant: newTx.merchant,
                  category: newTx.category,
                  amount: newTx.amount,
                  currency: newTx.currency,
                });
                if (!res?.ok) {
                  setCreateError(res?.error?.message || "Failed to create transaction.");
                  return;
                }
                setNewTx((p) => ({ ...p, merchant: "", category: "", amount: "" }));
              } finally {
                setCreating(false);
              }
            }}
            style={{ display: "grid", gap: 10 }}
          >
            <label className="ss-muted" style={{ fontSize: 12 }}>
              Date
              <input
                className="ss-input"
                type="date"
                value={newTx.date}
                onChange={(e) => setNewTx((p) => ({ ...p, date: e.target.value }))}
                aria-label="New transaction date"
                disabled={creating}
              />
            </label>

            <label className="ss-muted" style={{ fontSize: 12 }}>
              Merchant
              <input
                className="ss-input"
                value={newTx.merchant}
                onChange={(e) => setNewTx((p) => ({ ...p, merchant: e.target.value }))}
                placeholder="e.g., Blue Bottle Coffee"
                aria-label="New transaction merchant"
                disabled={creating}
              />
            </label>

            <label className="ss-muted" style={{ fontSize: 12 }}>
              Category
              <input
                className="ss-input"
                value={newTx.category}
                onChange={(e) => setNewTx((p) => ({ ...p, category: e.target.value }))}
                placeholder="e.g., Dining"
                aria-label="New transaction category"
                disabled={creating}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label className="ss-muted" style={{ fontSize: 12 }}>
                Amount
                <input
                  className="ss-input"
                  inputMode="decimal"
                  value={newTx.amount}
                  onChange={(e) => setNewTx((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00"
                  aria-label="New transaction amount"
                  disabled={creating}
                />
              </label>

              <label className="ss-muted" style={{ fontSize: 12 }}>
                Currency
                <input
                  className="ss-input"
                  value={newTx.currency}
                  onChange={(e) => setNewTx((p) => ({ ...p, currency: e.target.value }))}
                  placeholder="USD"
                  aria-label="New transaction currency"
                  disabled={creating}
                />
              </label>
            </div>

            {createError ? (
              <div className="ss-card-caption" style={{ color: "var(--ss-error)" }}>
                {createError}
              </div>
            ) : prefs.demoMode ? (
              <div className="ss-card-caption">
                You are in demo mode. Creating transactions requires Supabase “Live” configuration + login.
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Button type="submit" disabled={creating}>
                {creating ? "Saving…" : "Save transaction"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setNewTx((p) => ({ ...p, merchant: "", category: "", amount: "" }))}
                disabled={creating}
              >
                Clear
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Tips" caption="Make the most of your data">
          <div className="ss-muted" style={{ fontSize: 13, lineHeight: 1.65 }}>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>New transactions appear instantly (optimistic UI) and stay synced via realtime.</li>
              <li>Use filters to share a view (they persist in the URL).</li>
              <li>In Live mode, ensure your Supabase RLS policies allow insert/select on your own rows.</li>
            </ul>
          </div>
        </Card>
      </div>

      <div style={{ height: 12 }} />

      {seedingState?.status === "failed" || dataError ? (
        <div className="ss-card" role="status" aria-label="Data status message">
          <div className="ss-card-pad">
            <div className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              <strong style={{ color: "rgba(255,255,255,0.9)" }}>Notice:</strong>{" "}
              {seedingState?.status === "failed" ? seedingState.message : dataError}
              <div style={{ height: 8 }} />
              <Button variant="ghost" onClick={() => refreshTransactions()} aria-label="Retry loading transactions">
                Retry
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="ss-card" aria-label="Transactions results summary">
        <div className="ss-card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <p className="ss-card-caption" style={{ margin: 0 }}>
            {isLoading ? (
              "Loading transactions…"
            ) : (
              <>
                Showing <strong>{rows.length}</strong> results.
              </>
            )}
          </p>
          <Button variant="ghost" onClick={() => {}} aria-label="Import transactions (stub)">
            Import transactions
          </Button>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <DataTable
        columns={columns}
        rows={rows}
        pageSize={10}
        isLoading={isLoading}
        emptySlot={
          <EmptyState
            title="No transactions match your filters"
            description="Try adjusting the date range, category, or amount filters. If you’re expecting data, import a dataset to get started."
            primaryAction={{ label: "Import transactions", onClick: () => {}, variant: "primary" }}
            secondaryAction={{ label: "Reset filters", onClick: reset, variant: "ghost" }}
          />
        }
      />
    </main>
  );
}

