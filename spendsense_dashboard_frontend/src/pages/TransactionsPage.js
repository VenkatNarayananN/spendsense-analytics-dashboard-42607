import React, { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import { Button, Chip, PageHeader } from "../components/ui";
import { IconSearch } from "../components/icons";
import { getTransactionsMock } from "../mock/mockData";

function fmtCurrency(n) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

const statusTone = {
  Cleared: "success",
  Pending: "secondary",
  Flagged: "error",
};

// PUBLIC_INTERFACE
export default function TransactionsPage() {
  /** Searchable + filterable transactions table using mock data. */
  const all = useMemo(() => getTransactionsMock(), []);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const categories = useMemo(() => ["All", ...Array.from(new Set(all.map((t) => t.category)))], [all]);

  const rows = useMemo(() => {
    const qLower = q.trim().toLowerCase();

    return all.filter((t) => {
      if (qLower) {
        const text = `${t.merchant} ${t.category} ${t.status} ${t.date}`.toLowerCase();
        if (!text.includes(qLower)) return false;
      }

      if (category !== "All" && t.category !== category) return false;

      if (from && t.date < from) return false;
      if (to && t.date > to) return false;

      const min = minAmount === "" ? null : Number(minAmount);
      const max = maxAmount === "" ? null : Number(maxAmount);
      if (min != null && t.amount < min) return false;
      if (max != null && t.amount > max) return false;

      return true;
    });
  }, [all, q, category, minAmount, maxAmount, from, to]);

  const columns = useMemo(
    () => [
      { key: "date", header: "Date" },
      { key: "merchant", header: "Merchant" },
      { key: "category", header: "Category" },
      {
        key: "amount",
        header: "Amount",
        render: (r) => <span style={{ fontWeight: 800 }}>{fmtCurrency(r.amount)}</span>,
      },
      {
        key: "status",
        header: "Status",
        render: (r) => <Chip tone={statusTone[r.status] || "primary"}>{r.status}</Chip>,
      },
    ],
    []
  );

  const reset = () => {
    setQ("");
    setCategory("All");
    setMinAmount("");
    setMaxAmount("");
    setFrom("");
    setTo("");
  };

  return (
    <main role="main" aria-label="Transactions">
      <PageHeader
        title="Transactions"
        description="Search, filter, and review your transactions. (Mock dataset; API wiring later.)"
        right={
          <Button variant="ghost" onClick={reset} aria-label="Reset filters">
            Reset
          </Button>
        }
      />

      <div className="ss-card">
        <div className="ss-card-pad">
          <div className="ss-toolbar" aria-label="Transaction filters">
            <div className="ss-toolbar-left" style={{ flex: "1 1 340px" }}>
              <div style={{ position: "relative", minWidth: 260, flex: "1 1 320px" }}>
                <span style={{ position: "absolute", left: 12, top: 11, color: "rgba(55,65,81,0.55)" }}>
                  <IconSearch />
                </span>
                <input
                  className="ss-input"
                  style={{ paddingLeft: 40 }}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search merchant, category, status…"
                  aria-label="Search transactions"
                />
              </div>

              <select className="ss-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="ss-toolbar-right" style={{ flex: "1 1 420px", justifyContent: "flex-end" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <label className="ss-muted" style={{ fontSize: 12 }}>
                  From
                  <input className="ss-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Date from" />
                </label>
                <label className="ss-muted" style={{ fontSize: 12 }}>
                  To
                  <input className="ss-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Date to" />
                </label>
                <label className="ss-muted" style={{ fontSize: 12 }}>
                  Min
                  <input
                    className="ss-input"
                    inputMode="decimal"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="0"
                    aria-label="Minimum amount"
                  />
                </label>
                <label className="ss-muted" style={{ fontSize: 12 }}>
                  Max
                  <input
                    className="ss-input"
                    inputMode="decimal"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="999"
                    aria-label="Maximum amount"
                  />
                </label>
              </div>
            </div>
          </div>

          <p className="ss-card-caption" style={{ margin: 0 }}>
            Showing <strong>{rows.length}</strong> results.
          </p>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <DataTable
        columns={columns}
        rows={rows.sort((a, b) => (a.date < b.date ? 1 : -1))}
        pageSize={10}
        emptyMessage="No transactions match these filters."
      />
    </main>
  );
}
