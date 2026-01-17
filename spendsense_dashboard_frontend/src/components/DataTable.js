import React, { useMemo, useState } from "react";
import { Button } from "./ui";

/**
 * Generic table for client-side datasets. Keeps pages readable.
 */

// PUBLIC_INTERFACE
export default function DataTable({ columns, rows, pageSize = 10, rowKey = (r) => r.id, emptyMessage }) {
  /** Render a styled table with pagination. columns: [{key, header, render?}] */
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize]);

  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;

  return (
    <div className="ss-card">
      <div className="ss-card-pad" style={{ paddingBottom: 16 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="ss-table" role="table" aria-label="data table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key} scope="col">
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ padding: 18 }} className="ss-muted">
                    {emptyMessage || "No results."}
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => (
                  <tr key={rowKey(r)}>
                    {columns.map((c) => (
                      <td key={c.key}>{c.render ? c.render(r) : r[c.key]}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="ss-pagination" role="navigation" aria-label="pagination">
          <span className="ss-muted" style={{ fontSize: 12 }}>
            Page <strong>{safePage}</strong> of <strong>{totalPages}</strong> • {rows.length} rows
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev} aria-label="Previous page">
              Prev
            </Button>
            <Button variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={!canNext} aria-label="Next page">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
