import type { KeyboardEvent, MouseEvent } from "react";
import { cn } from "cn";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import type { DataTableEngine, DataTableEngineRow } from "../hooks/use-data-table";
import type { RowSelectionControls } from "../hooks/use-row-selection";
import type { DataTableRow as RowData } from "../lib/columns";
import { opensRow } from "../lib/row-activation";
import type { DataTableRowSlot } from "../lib/types";

/** Every second row is tinted so the eye can follow a row across wide tables. */
export const zebra = "even:bg-muted/40";

export function DataTableRow<TData extends RowData>({ table, row, selection, onRowOpen, className, rowSlot }: {
  table: DataTableEngine<TData>;
  row: DataTableEngineRow<TData>;
  selection: RowSelectionControls | null;
  onRowOpen: ((row: TData) => void) | undefined;
  className: string | undefined;
  rowSlot: DataTableRowSlot | undefined;
}) {
  const isSelected = selection?.isSelected(row.id) ?? false;
  const cells = <>
    {selection ? <TableCell className="w-10">
      <Checkbox aria-label="Select row" checked={isSelected} disabled={!selection.canSelect(row.id)} onCheckedChange={() => selection.toggleRow(row.id)} />
    </TableCell> : null}
    {row.getVisibleCells().map((cell) =>
      <TableCell key={cell.id} className="break-words whitespace-normal"><table.FlexRender cell={cell} /></TableCell>)}
  </>;
  if (rowSlot) return <rowSlot.Row id={row.id} className={className}>{cells}</rowSlot.Row>;
  const open = onRowOpen ? {
    tabIndex: 0,
    onClick: (event: MouseEvent<HTMLTableRowElement>) => { if (opensRow(event)) onRowOpen(row.original); },
    onKeyDown: (event: KeyboardEvent<HTMLTableRowElement>) => {
      if (event.key === "Enter" && event.target === event.currentTarget) { event.preventDefault(); onRowOpen(row.original); }
    },
  } : {};
  return <TableRow data-state={isSelected ? "selected" : undefined} {...open}
    className={cn(zebra, onRowOpen && "cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2", className)}>{cells}</TableRow>;
}
