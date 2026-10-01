import { cn } from "cn";
import { TableFooter } from "@/components/ui/table";
import { useDataTable } from "../hooks/use-data-table";
import { useRowSelection } from "../hooks/use-row-selection";
import type { DataTableRow } from "../lib/columns";
import { pageSlice } from "../lib/pagination";
import type { DataTableViewProps } from "../lib/types";
import { ColumnToggle } from "./column-toggle";
import { DataTableBody } from "./data-table-body";
import { DataTableFooter } from "./data-table-footer";
import { DataTableHead } from "./data-table-head";
import { StaleRowsNotice } from "./stale-rows-notice";

/** The shared table: every variant renders this with its own paging and sorting decisions. */
export function DataTableView<TData extends DataTableRow>({
  label, columns, rows, getRowId, sorting, onSortingChange, manualSorting, sliceRows, paging, loading = false, refreshing = false,
  error = null, onRetry, emptyTitle, emptyDescription, selection, onRowOpen, rowClassName, toolbar, footer, rowSlot, className,
  columnToggle = false, maxHeight, fill = false,
}: DataTableViewProps<TData>) {
  const { table, toggleColumns, setColumnVisible, showAllColumns } = useDataTable({ columns, rows, getRowId, sorting, onSortingChange, manualSorting });
  const sorted = table.getRowModel().rows;
  const visible = sliceRows && paging ? pageSlice(sorted, paging.page, paging.pageSize) : sorted;
  const selectionControls = useRowSelection(selection, visible);
  const columnCount = table.getVisibleLeafColumns().length + (selection ? 1 : 0) + (rowSlot ? 1 : 0);

  const scrolls = fill || Boolean(maxHeight);
  return <div className={cn("min-w-0 overflow-hidden rounded-lg border bg-card", fill && "flex min-h-0 flex-1 flex-col", className)}
    aria-busy={loading || refreshing}>
    {toolbar || columnToggle ? <div className="flex flex-none flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
      <div className="min-w-0 flex-1">{toolbar}</div>
      {columnToggle ? <ColumnToggle columns={toggleColumns} onToggle={setColumnVisible} onReset={showAllColumns} /> : null}
    </div> : null}
    {error && visible.length > 0 ? <StaleRowsNotice error={error} onRetry={onRetry} /> : null}
    <div data-slot="table-container" className={cn("relative w-full overflow-x-auto", scrolls && "overflow-y-auto", fill && "min-h-0 flex-1")}
      {...(maxHeight && !fill ? { style: { maxHeight } } : {})}>
      <table className={cn("w-full table-fixed caption-bottom text-sm", refreshing && "opacity-70 transition-opacity")}>
        <caption className="sr-only">{label}</caption>
        <DataTableHead table={table} selection={selectionControls} leadingHeader={rowSlot ? rowSlot.leadingHeader : null} sticky={scrolls} />
        <DataTableBody table={table} rows={visible} columnCount={columnCount} skeletonRows={Math.min(paging?.pageSize ?? 8, 8)}
          selection={selectionControls} loading={loading} error={error} onRetry={onRetry} emptyTitle={emptyTitle}
          emptyDescription={emptyDescription} onRowOpen={onRowOpen} rowClassName={rowClassName} rowSlot={rowSlot} />
        {footer && visible.length > 0 ? <TableFooter>{footer}</TableFooter> : null}
      </table>
    </div>
    {paging ? <DataTableFooter paging={paging} rowsOnPage={visible.length} refreshing={refreshing}
      selectedCount={selectionControls?.count ?? null} /> : null}
  </div>;
}
