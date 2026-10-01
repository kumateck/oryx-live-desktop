import { useMemo } from "react";
import type { DataTableColumn, DataTableRow } from "../lib/columns";

/** The same columns with sorting switched off, for tables whose row order must not change. */
export function usePlainColumns<TData extends DataTableRow>(columns: readonly DataTableColumn<TData>[], sortable: boolean) {
  return useMemo(() => sortable ? columns : columns.map((column) => ({ ...column, enableSorting: false })), [sortable, columns]);
}
