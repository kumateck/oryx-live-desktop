import { clampPage, pageCount, rowRange } from "../lib/pagination";
import type { DataTablePaging } from "../lib/types";
import { PageButtons } from "./page-buttons";
import { PageSizeSelect } from "./page-size-select";

export function DataTableFooter({ paging, rowsOnPage, refreshing, selectedCount }: {
  paging: DataTablePaging;
  rowsOnPage: number;
  refreshing: boolean;
  selectedCount: number | null;
}) {
  const pages = pageCount(paging.totalRows, paging.pageSize);
  const page = clampPage(paging.page, paging.totalRows, paging.pageSize);
  const range = rowRange(page, paging.pageSize, paging.totalRows, rowsOnPage);
  const go = (next: number) => { const target = Math.min(Math.max(1, next), pages); if (target !== paging.page) paging.onPageChange(target); };
  return <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t px-3 py-2 text-xs text-muted-foreground">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span role="status">{refreshing ? "Updating… " : ""}{paging.totalRows === 0 ? "No rows" : `${range.from}–${range.to} of ${paging.totalRows}`}
        {selectedCount ? ` · ${selectedCount} selected` : ""}</span>
      <PageSizeSelect pageSize={paging.pageSize} sizes={paging.pageSizes} onChange={paging.onPageSizeChange} />
    </div>
    <PageButtons page={page} pages={pages} onChange={go} />
  </div>;
}
