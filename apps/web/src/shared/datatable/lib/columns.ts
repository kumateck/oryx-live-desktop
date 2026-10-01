import {
  columnSizingFeature, columnVisibilityFeature, createColumnHelper, createSortedRowModel, rowSortingFeature, tableFeatures,
  type ColumnDef, type RowData, type SortingState,
} from "@tanstack/react-table";

// Paging and row selection are handled by the table components themselves (see data-table.tsx),
// so the table engine only needs sorting, declared column widths, and column visibility.
export const dataTableFeatures = tableFeatures({
  rowSortingFeature, columnSizingFeature, columnVisibilityFeature, sortedRowModel: createSortedRowModel(),
});

export type DataTableRow = RowData;
// Columns of one table hold different value types, so the value parameter is left open, as in TanStack's own helpers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataTableColumn<TData extends DataTableRow> = ColumnDef<typeof dataTableFeatures, TData, any>;
export type DataTableSorting = SortingState;

/** Column builder for a row type: `const column = dataTableColumns<Role>()`, then `column.accessor(...)`. */
export function dataTableColumns<TData extends DataTableRow>() {
  return createColumnHelper<typeof dataTableFeatures, TData>();
}
