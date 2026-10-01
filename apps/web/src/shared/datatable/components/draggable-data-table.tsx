import { useMemo } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDragReorder } from "../hooks/use-drag-reorder";
import { usePlainColumns } from "../hooks/use-plain-columns";
import type { DataTableRow } from "../lib/columns";
import type { DataTableCommonProps } from "../lib/types";
import { DataTableView } from "./data-table-view";
import { DragRowsContext, sortableRowSlot, type DragRows } from "./sortable-row";

export interface DraggableDataTableProps<TData extends DataTableRow> extends Omit<DataTableCommonProps<TData>, "selection" | "onRowOpen"> {
  rows: readonly TData[] | null | undefined;
  /** Called with the new order after a row is dropped in a different position. */
  onReorder: (rows: TData[], move: { id: string; from: number; to: number }) => void;
  /** Turns reordering off, for example while a save is in progress or for read-only users. */
  disabled?: boolean;
  /** Names a row for screen-reader announcements; defaults to its position. */
  describeRow?: (row: TData) => string;
}

const none: never[] = [];
const modifiers = [restrictToVerticalAxis, restrictToParentElement];
const ignoreSorting = () => {};

/**
 * Table whose rows are put in order by dragging a handle, or from the keyboard: focus the handle,
 * press Space, move with the arrow keys, press Space to drop or Escape to cancel.
 */
export function DraggableDataTable<TData extends DataTableRow>({
  rows, getRowId, onReorder, disabled = false, describeRow, columns, ...view
}: DraggableDataTableProps<TData>) {
  const all = rows ?? none;
  const drag = useDragReorder({ rows: all, getRowId, onReorder, describeRow, disabled: disabled || Boolean(view.loading) });
  const dragRows = useMemo<DragRows>(() => ({ locked: drag.locked, nameOf: drag.nameOf }), [drag.locked, drag.nameOf]);
  const plainColumns = usePlainColumns(columns, false);
  return <DndContext sensors={drag.sensors} collisionDetection={closestCenter} modifiers={modifiers} onDragEnd={drag.onDragEnd}
    accessibility={{ announcements: drag.announcements }}>
    <SortableContext items={drag.ids} strategy={verticalListSortingStrategy} disabled={drag.locked}>
      <DragRowsContext.Provider value={dragRows}>
        <DataTableView {...view} rows={all} getRowId={getRowId} paging={null} sliceRows={false} manualSorting sorting={none}
          onSortingChange={ignoreSorting} rowSlot={sortableRowSlot} columns={plainColumns} />
      </DragRowsContext.Provider>
    </SortableContext>
  </DndContext>;
}
