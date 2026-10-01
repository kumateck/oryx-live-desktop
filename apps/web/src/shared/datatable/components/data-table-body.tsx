import { TableBody } from "@/components/ui/table";
import type { DataTableEngine, DataTableEngineRow } from "../hooks/use-data-table";
import type { RowSelectionControls } from "../hooks/use-row-selection";
import type { DataTableRow as RowData } from "../lib/columns";
import type { DataTableViewProps } from "../lib/types";
import { DataTableRow } from "./data-table-row";
import { DataTableMessage, DataTableSkeleton } from "./data-table-states";

type BodyProps<TData extends RowData> = Pick<DataTableViewProps<TData>, "loading" | "error" | "onRetry" | "emptyTitle"
  | "emptyDescription" | "onRowOpen" | "rowClassName" | "rowSlot"> & {
  table: DataTableEngine<TData>;
  rows: readonly DataTableEngineRow<TData>[];
  columnCount: number;
  skeletonRows: number;
  selection: RowSelectionControls | null;
};

/** Chooses between placeholder rows, a load failure, an empty list, and the rows themselves. */
export function DataTableBody<TData extends RowData>({
  table, rows, columnCount, skeletonRows, selection, loading, error, onRetry, emptyTitle = "Nothing to show", emptyDescription,
  onRowOpen, rowClassName, rowSlot,
}: BodyProps<TData>) {
  return <TableBody>
    {rows.length > 0 ? rows.map((row) => <DataTableRow key={row.id} table={table} row={row} selection={selection} onRowOpen={onRowOpen}
      className={rowClassName?.(row.original)} rowSlot={rowSlot} />) :
      loading ? <DataTableSkeleton columns={columnCount} rows={skeletonRows} /> :
        error ? <DataTableMessage columns={columnCount} tone="error" title="This list could not be loaded" description={error}
          {...(onRetry ? { action: { label: "Retry", onClick: onRetry } } : {})} /> :
          <DataTableMessage columns={columnCount} tone="empty" title={emptyTitle} description={emptyDescription} />}
  </TableBody>;
}
