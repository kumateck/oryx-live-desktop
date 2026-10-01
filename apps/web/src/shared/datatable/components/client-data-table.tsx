import { useState } from "react";
import type { DataTableRow, DataTableSorting } from "../lib/columns";
import { clampPage } from "../lib/pagination";
import type { DataTableCommonProps } from "../lib/types";
import { DataTableView } from "./data-table-view";

export interface ClientDataTableProps<TData extends DataTableRow> extends DataTableCommonProps<TData> {
  /** Every row; the table sorts and pages them in the browser. */
  rows: readonly TData[] | null | undefined;
  initialPageSize?: number;
  pageSizes?: readonly number[];
  initialSorting?: DataTableSorting;
}

const none: never[] = [];

/** Table for lists the backend returns whole. */
export function ClientDataTable<TData extends DataTableRow>({
  rows, initialPageSize = 20, pageSizes, initialSorting = none, ...view
}: ClientDataTableProps<TData>) {
  const all = rows ?? none;
  const [sorting, setSorting] = useState<DataTableSorting>(initialSorting);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [requestedPage, setPage] = useState(1);
  // A refetch, search, or delete can shrink the list: stay on the nearest valid page instead of
  // jumping back to the first one or showing an empty page.
  const page = clampPage(requestedPage, all.length, pageSize);
  return <DataTableView {...view} rows={all} sorting={sorting} manualSorting={false} sliceRows
    onSortingChange={(next) => { setSorting(next); setPage(1); }}
    paging={{ page, pageSize, totalRows: all.length, pageSizes, onPageChange: setPage,
      onPageSizeChange: (size) => { setPageSize(size); setPage(1); } }} />;
}
