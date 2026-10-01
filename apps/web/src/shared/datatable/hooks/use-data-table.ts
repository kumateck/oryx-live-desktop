import { useMemo, useState } from "react";
import { useTable } from "@tanstack/react-table";
import { dataTableFeatures, type DataTableColumn, type DataTableRow, type DataTableSorting } from "../lib/columns";
import { columnLabel } from "../lib/column-label";

const noRows: never[] = [];

interface Options<TData extends DataTableRow> {
  columns: readonly DataTableColumn<TData>[];
  rows: readonly TData[];
  getRowId: (row: TData) => string;
  sorting: DataTableSorting;
  onSortingChange: (sorting: DataTableSorting) => void;
  manualSorting: boolean;
}

/** Sets up the table engine: sorting state from the caller, column visibility kept here. */
export function useDataTable<TData extends DataTableRow>({ columns, rows, getRowId, sorting, onSortingChange, manualSorting }: Options<TData>) {
  // The engine re-processes when these references change; give it stable ones.
  const data = useMemo(() => rows.length ? [...rows] : noRows, [rows]);
  const columnDefs = useMemo(() => [...columns], [columns]);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const table = useTable({
    features: dataTableFeatures,
    columns: columnDefs,
    data,
    getRowId,
    manualSorting,
    // One order for every column: ascending, descending, then unsorted.
    sortDescFirst: false,
    enableSortingRemoval: true,
    state: { sorting, columnVisibility: hidden },
    onSortingChange: (updater) => onSortingChange(typeof updater === "function" ? updater(sorting) : updater),
    onColumnVisibilityChange: (updater) => setHidden((current) => typeof updater === "function" ? updater(current) : updater),
  }, (state) => ({ sorting: state.sorting, columnVisibility: state.columnVisibility }));

  const toggleColumns = table.getAllLeafColumns().map((column) => {
    const header = column.columnDef.header;
    return { id: column.id, label: typeof header === "string" && header ? header : columnLabel(column.id),
      visible: column.getIsVisible(), canHide: column.getCanHide() };
  });
  return {
    table,
    toggleColumns,
    setColumnVisible: (id: string, visible: boolean) => setHidden((current) => ({ ...current, [id]: visible })),
    showAllColumns: () => setHidden({}),
  };
}

export type DataTableEngine<TData extends DataTableRow> = ReturnType<typeof useDataTable<TData>>["table"];
export type DataTableEngineRow<TData extends DataTableRow> = ReturnType<DataTableEngine<TData>["getRowModel"]>["rows"][number];
