import type { ReactNode } from "react";
import { cn } from "cn";
import { Checkbox } from "@/components/ui/checkbox";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DataTableEngine } from "../hooks/use-data-table";
import type { RowSelectionControls } from "../hooks/use-row-selection";
import type { DataTableRow } from "../lib/columns";
import { SortHeaderButton } from "./sort-header-button";

const ariaSort = { asc: "ascending", desc: "descending" } as const;

export function DataTableHead<TData extends DataTableRow>({ table, selection, leadingHeader, sticky }: {
  table: DataTableEngine<TData>;
  selection: RowSelectionControls | null;
  /** Header of a variant's own first column, such as the drag handle. */
  leadingHeader: ReactNode | null;
  /** Keeps header cells in view while rows scroll inside a height-limited table. */
  sticky: boolean;
}) {
  // Quiet, opaque headers keep dense columns legible while rows scroll beneath them.
  const cell = cn("bg-muted text-foreground", sticky && "sticky top-0 z-10");
  return <TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id} className="border-0 hover:bg-transparent">
    {leadingHeader !== null ? <TableHead className={cn("w-10", cell)}>{leadingHeader}</TableHead> : null}
    {selection ? <TableHead className={cn("w-10", cell)}>
      <Checkbox className="border-muted-foreground"
        aria-label="Select all rows on this page" disabled={!selection.canSelectAny} onCheckedChange={selection.togglePage}
        checked={selection.pageState === "all" && selection.canSelectAny ? true : selection.pageState === "some" ? "indeterminate" : false} />
    </TableHead> : null}
    {group.headers.map((header) => {
      const direction = header.column.getIsSorted();
      const sortable = header.column.getCanSort();
      const width = header.column.columnDef.size;
      return <TableHead key={header.id} colSpan={header.colSpan} className={cn("whitespace-normal", cell)}
        {...(width ? { style: { width } } : {})}
        {...(sortable ? { "aria-sort": direction ? ariaSort[direction] : "none" as const } : {})}>
        {header.isPlaceholder ? null : sortable
          ? <SortHeaderButton direction={direction} onToggle={header.column.getToggleSortingHandler()}><table.FlexRender header={header} /></SortHeaderButton>
          : <table.FlexRender header={header} />}
      </TableHead>;
    })}
  </TableRow>)}</TableHeader>;
}
