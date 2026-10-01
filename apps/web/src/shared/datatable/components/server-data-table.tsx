import { useEffect } from "react";
import { usePlainColumns } from "../hooks/use-plain-columns";
import type { DataTableRow, DataTableSorting } from "../lib/columns";
import { clampPage } from "../lib/pagination";
import type { DataTableCommonProps } from "../lib/types";
import { DataTableView } from "./data-table-view";

export interface ServerDataTableProps<TData extends DataTableRow> extends DataTableCommonProps<TData> {
  /** The current page of rows, as returned by the backend. */
  rows: readonly TData[] | null | undefined;
  /** 1-based page that was requested. */
  page: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizes?: readonly number[];
  /** Omit when the endpoint cannot sort; column headers are then not sortable. */
  sorting?: DataTableSorting;
  onSortingChange?: (sorting: DataTableSorting) => void;
}

const none: never[] = [];

/** Table for endpoints that page (and optionally sort) on the backend. */
export function ServerDataTable<TData extends DataTableRow>({
  rows, page, pageSize, totalRows, onPageChange, onPageSizeChange, pageSizes, sorting, onSortingChange, columns, ...view
}: ServerDataTableProps<TData>) {
  const settled = !view.loading && !view.refreshing && !view.error;
  const lastPage = clampPage(page, totalRows, pageSize);
  // Rows deleted elsewhere can leave the requested page past the end: ask for the last real page.
  useEffect(() => { if (settled && page !== lastPage) onPageChange(lastPage); }, [settled, page, lastPage, onPageChange]);
  const shown = usePlainColumns(columns, Boolean(sorting && onSortingChange));
  return <DataTableView {...view} rows={rows ?? none} sliceRows={false} manualSorting columns={shown}
    sorting={sorting ?? none} onSortingChange={(next) => onSortingChange?.(next)}
    paging={{ page, pageSize, totalRows, pageSizes, onPageChange, onPageSizeChange }} />;
}
