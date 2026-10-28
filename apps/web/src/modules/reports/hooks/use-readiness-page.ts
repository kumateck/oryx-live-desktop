import { useState } from "react";
import { clampPage, pageSlice } from "@/shared/datatable/lib/pagination";
import type { ReadinessView } from "../schemas/production-readiness";

/** Page only the screen; the original snapshot remains intact for printing and export. */
export function useReadinessPage({ report, mode }: ReadinessView, paper: boolean) {
  const [requestedPage, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const totalRows = mode === "products" ? report.products.length
    : report.markets.reduce((sum, group) => sum + group.rows.length, 0);
  const page = clampPage(requestedPage, totalRows, pageSize);
  let offset = 0;
  const first = (page - 1) * pageSize;
  const markets = paper ? report.markets : report.markets.flatMap((group) => {
    const start = offset; offset += group.rows.length;
    const rows = group.rows.slice(Math.max(0, first - start), Math.max(0, Math.min(group.rows.length, first + pageSize - start)));
    return rows.length ? [{ ...group, rows }] : [];
  });
  return { markets, products: paper ? report.products : pageSlice(report.products, page, pageSize),
    paged: !paper && totalRows > 30,
    rowsOnPage: Math.max(0, Math.min(pageSize, totalRows - first)),
    paging: { page, pageSize, totalRows, onPageChange: setPage,
      onPageSizeChange: (size: number) => { setPageSize(size); setPage(1); } } };
}
