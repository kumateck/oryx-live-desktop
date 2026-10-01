import { useState } from "react";
import { usePlainColumns } from "../hooks/use-plain-columns";
import type { DataTableRow, DataTableSorting } from "../lib/columns";
import type { DataTableCommonProps } from "../lib/types";
import { DataTableView } from "./data-table-view";

export interface ListDataTableProps<TData extends DataTableRow> extends DataTableCommonProps<TData> {
  rows: readonly TData[] | null | undefined;
  /** Lists keep the order they are given unless sorting is enabled. */
  sortable?: boolean;
}

const none: never[] = [];

/**
 * Table that shows every row without paging: line items in a form, short reference lists, totals.
 * Combine with the editable cells for rows the user fills in.
 */
export function ListDataTable<TData extends DataTableRow>({ rows, sortable = false, columns, ...view }: ListDataTableProps<TData>) {
  const [sorting, setSorting] = useState<DataTableSorting>(none);
  const shown = usePlainColumns(columns, sortable);
  return <DataTableView {...view} rows={rows ?? none} paging={null} sliceRows={false} manualSorting={false} columns={shown}
    sorting={sortable ? sorting : none} onSortingChange={setSorting} />;
}
