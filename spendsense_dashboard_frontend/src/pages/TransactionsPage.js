import React, { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import { Button, Chip, LiveBadge, PageHeader } from "../components/ui";

import { EmptyState } from "../components/ux";

import { usePreferences } from "../state/preferences";
import { useAppData } from "../state/appData";

function fmtCurrency(n, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `$${Number(n || 0).toFixed(2)}`;
  }
}


// PUBLIC_INTERFACE
export default function TransactionsPage() {
  /** Searchable + filterable transactions table with realistic demo data and URL-synced filters. */
  const { prefs } = usePreferences();
  const {
    transactions: ctxTransactions,
    loadingData,
    dataError,
    seedingState,
    realtimeStatus,
    refreshTransactions,
    createTransaction,
  } = useAppData();

  const [newTxOpen, setNewTxOpen] = useState(false);
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

  const canOpenNewTx = !prefs.demoMode;

  const openNewTx = () => {
    setCreateError("");
    setNewTx((p) => ({
      date: p?.date || new Date().toISOString().slice(0, 10),
      merchant: "",
      category: "",
      amount: "",
      currency: prefs.currency || p?.currency || "USD",
    }));
    setNewTxOpen(true);
  };

  const closeNewTx = () => {
    if (creating) return;
    setNewTxOpen(false);
  };

  const submitNewTx = async (e) => {
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

      // Close immediately; list updates optimistically from context.
      setNewTxOpen(false);
    } finally {
      setCreating(false);
    }
  };

  // Loading: rely on shared context (seed + fetch). Keep bounded by context behavior.
  const isLoading = Boolean(loadingData);

  const rows = useMemo(() => {
    // Context already provides a safe fallback when Supabase is unavailable or empty.
    return Array.isArray(ctxTransactions) ? ctxTransactions : [];
  }, [ctxTransactions]);

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

  const topRight = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <Chip tone={prefs.demoMode ? "secondary" : "primary"}>{prefs.demoMode ? "Demo mode" : "Live"}</Chip>
      {!prefs.demoMode ? <LiveBadge status={realtimeStatus?.transactions} label="Live" /> : null}
      <Button variant="primary" onClick={openNewTx} disabled={!canOpenNewTx} aria-label="New Transaction">
        New Transaction
      </Button>
    </div>
  );

  return (
    <main role="main" aria-label="Transactions" className="ss-transactions-page">
      <PageHeader
        title="Transactions"
        description="Search, filter, and review your transactions."
        right={topRight}
      />

      <div className="ss-transactions-spacer" />

      {seedingState?.status === "failed" || dataError ? (
        <div className="ss-card" role="status" aria-label="Data status message">
          <div className="ss-card-pad">
            <div className="ss-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              <strong style={{ color: "var(--ss-text-primary)" }}>Notice:</strong>{" "}
              {seedingState?.status === "failed" ? seedingState.message : dataError}
              <div style={{ height: 8 }} />
              <Button variant="ghost" onClick={() => refreshTransactions()} aria-label="Retry loading transactions">
                Retry
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Table card like the reference */}
      <section className="ss-card ss-transactions-card" aria-label="Transactions table">
        <div className="ss-card-pad ss-transactions-cardpad">
          <div className="ss-transactions-cardhead">
            <div>
              <h3 className="ss-card-title">Transactions</h3>
              <p className="ss-card-caption">
                {isLoading ? (
                  "Loading transactions…"
                ) : (
                  <>
                    Showing <strong>{rows.length}</strong> results.
                  </>
                )}
              </p>
            </div>

            {/* Reserved for future table-level actions; kept to match reference spacing */}
            <div className="ss-transactions-cardhead-right" />
          </div>

          <DataTable
            columns={columns}
            rows={rows}
            pageSize={10}
            isLoading={isLoading}
            emptySlot={
              <EmptyState
                title="No transactions yet"
                description="Once transactions are available, they will appear here."
                primaryAction={{ label: "Refresh", onClick: () => refreshTransactions(), variant: "primary" }}
              />
            }
          />
        </div>
      </section>

      {/* Modal (matches Alerts modal UX) */}
      {newTxOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="New transaction modal"
          onMouseDown={(e) => {
            // Click outside closes (but do not close during submit)
            if (e.target === e.currentTarget) closeNewTx();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17, 24, 39, 0.55)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            className="ss-card"
            style={{
              width: "min(640px, 100%)",
              borderRadius: 20,
              boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
            }}
          >
            <div className="ss-card-pad">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <h3 className="ss-card-title">New Transaction</h3>
                  <p className="ss-card-caption">Add a transaction and save it to Supabase (Live mode).</p>
                </div>
                <Button variant="ghost" onClick={closeNewTx} disabled={creating} aria-label="Close new transaction modal">
                  Close
                </Button>
              </div>

              {!canOpenNewTx ? (
                <div className="ss-muted" style={{ fontSize: 13, marginTop: 10, lineHeight: 1.6 }}>
                  Creating transactions is disabled in Demo mode. Sign in / enable Supabase to use this feature.
                </div>
              ) : (
                <form onSubmit={submitNewTx} style={{ marginTop: 12, display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
                  </div>

                  {createError ? (
                    <div
                      role="status"
                      style={{
                        border: "1px solid color-mix(in srgb, var(--ss-danger) 45%, var(--ss-border-color))",
                        background: "color-mix(in srgb, var(--ss-danger) 10%, var(--ss-card-bg))",
                        borderRadius: 14,
                        padding: 10,
                        color: "var(--ss-text-primary)",
                        fontSize: 13,
                      }}
                    >
                      {createError}
                    </div>
                  ) : null}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
                    <Button variant="ghost" type="button" onClick={closeNewTx} disabled={creating} aria-label="Cancel">
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={creating || !newTx.merchant.trim() || !newTx.category.trim() || !String(newTx.amount).trim()}
                      aria-label="Create transaction"
                    >
                      {creating ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

