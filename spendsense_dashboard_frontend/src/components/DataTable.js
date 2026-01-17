import React, { useEffect, useMemo, useState } from "react";
import { Button } from "./ui";
import { EmptyState, SkeletonBlock } from "./ux";

/**
 * Generic table for client-side datasets. Keeps pages readable.
 */

function makeSkeletonRows(count, cols) {
  return Array.from({ length: count }).map((_, i) => ({
    __id: `sk_${i}`,
    __cols: cols,
  }));
}

// PUBLIC_INTERFACE
export default function DataTable({
  columns,
  rows,
  pageSize = 10,
  rowKey = (r) => r.id,
  emptyMessage,
  isLoading = false,
  emptySlot = null,
  skeletonRowCount = 8,
}) {
  /** Render a styled table with pagination. columns: [{key, header, render?}] */
  const [page, setPage] = useState(1);

  // Reset pagination when dataset changes (common UX expectation when filtering)
  useEffect(() => {
    setPage(1);
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil((rows?.length || 0) / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    if (isLoading) return [];
    const start = (safePage - 1) * pageSize;
    return (rows || []).slice(start, start + pageSize);
  }, [rows, safePage, pageSize, isLoading]);

  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;

  const renderBody = () => {
    if (isLoading) {
      const skeletons = makeSkeletonRows(skeletonRowCount, columns.length);
      return skeletons.map((r) => (
        <tr key={r.__id} aria-hidden="true">
          {Array.from({ length: r.__cols }).map((__, ci) => (
            <td key={ci}>
              <SkeletonBlock style={{ height: 12, width: ci === 0 ? "65%" : "85%", borderRadius: 999 }} />
            </td>
          ))}
        </tr>
      ));
    }

    if (pageRows.length === 0) {
      return (
        <tr>
          <td colSpan={columns.length} style={{ padding: 18 }}>
            {emptySlot ? (
              emptySlot
            ) : (
              <EmptyState title="No results" description={emptyMessage || "No results."} />
            )}
          </td>
        </tr>
      );
    }

    return pageRows.map((r) => (
      <tr key={rowKey(r)}>
        {columns.map((c) => (
          <td key={c.key}>{c.render ? c.render(r) : r[c.key]}</td>
        ))}
      </tr>
    ));
  };

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
            <tbody>{renderBody()}</tbody>
          </table>
        </div>

        <div className="ss-pagination" role="navigation" aria-label="pagination">
          <span className="ss-muted" style={{ fontSize: 12 }}>
            {isLoading ? (
              "Loading…"
            ) : (
              <>
                Page <strong>{safePage}</strong> of <strong>{totalPages}</strong> • {rows.length} rows
              </>
            )}
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev || isLoading}
              aria-label="Previous page"
            >
              Prev
            </Button>
            <Button
              variant="ghost"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={!canNext || isLoading}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
