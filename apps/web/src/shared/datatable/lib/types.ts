import type { ComponentType, ReactNode } from "react";
import type { DataTableColumn, DataTableRow, DataTableSorting } from "./columns";

export interface DataTablePaging {
  /** 1-based. */
  page: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizes?: readonly number[] | undefined;
}

export interface DataTableSelection<TData> {
  /** Selected row IDs. Keyed by `getRowId`, so a selection survives paging, sorting, and refetching. */
  selected: ReadonlySet<string>;
  onChange: (selected: Set<string>) => void;
  isSelectable?: (row: TData) => boolean;
}

/** Lets a table variant supply its own row element and a leading cell, as the draggable table does. */
export interface DataTableRowSlot {
  leadingHeader: ReactNode;
  Row: ComponentType<{ id: string; className?: string | undefined; children: ReactNode }>;
}

/** What every table variant accepts, whatever its paging. */
export interface DataTableCommonProps<TData extends DataTableRow> {
  /** Accessible name of the table, for example "Roles". */
  label: string;
  columns: readonly DataTableColumn<TData>[];
  getRowId: (row: TData) => string;
  /** First load: no rows yet. */
  loading?: boolean | undefined;
  /** Refetch while rows are already shown. */
  refreshing?: boolean | undefined;
  error?: string | null | undefined;
  onRetry?: (() => void) | undefined;
  emptyTitle?: string | undefined;
  emptyDescription?: string | undefined;
  selection?: DataTableSelection<TData> | undefined;
  onRowOpen?: ((row: TData) => void) | undefined;
  rowClassName?: ((row: TData) => string | undefined) | undefined;
  toolbar?: ReactNode;
  /** Rows shown below the body, such as totals. */
  footer?: ReactNode;
  className?: string | undefined;
  /** Adds a menu for showing and hiding columns. Give a column `enableHiding: false` to keep it always visible. */
  columnToggle?: boolean | undefined;
  /** CSS height limit, for example "24rem". Rows then scroll inside the table under a fixed header. */
  maxHeight?: string | undefined;
}

export interface DataTableViewProps<TData extends DataTableRow> extends DataTableCommonProps<TData> {
  /** Rows to sort and display. With `sliceRows`, all rows; otherwise the current page. */
  rows: readonly TData[];
  sorting: DataTableSorting;
  onSortingChange: (sorting: DataTableSorting) => void;
  /** True when the server already sorted the rows, or the order must not change. */
  manualSorting: boolean;
  /** Client paging: cut the sorted rows down to the current page. */
  sliceRows: boolean;
  paging: DataTablePaging | null;
  rowSlot?: DataTableRowSlot | undefined;
}
