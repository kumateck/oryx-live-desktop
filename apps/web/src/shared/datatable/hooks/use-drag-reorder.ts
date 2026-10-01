import { useMemo } from "react";
import { KeyboardSensor, PointerSensor, useSensor, useSensors, type Announcements, type DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { moveRowById } from "../lib/row-updates";

interface Options<TData> {
  rows: readonly TData[];
  getRowId: (row: TData) => string;
  onReorder: (rows: TData[], move: { id: string; from: number; to: number }) => void;
  disabled: boolean;
  describeRow?: ((row: TData) => string) | undefined;
}

/** Sensors, drop handling, and screen-reader announcements for reordering rows by ID. */
export function useDragReorder<TData>({ rows, getRowId, onReorder, disabled, describeRow }: Options<TData>) {
  const ids = useMemo(() => rows.map(getRowId), [rows, getRowId]);
  // Dragging relies on unique row IDs; with duplicates a drop could move the wrong row, so it is turned off.
  const locked = disabled || new Set(ids).size !== ids.length;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const nameOf = useMemo(() => (id: string | number) => {
    const index = ids.indexOf(String(id));
    const row = rows[index];
    return row && describeRow ? describeRow(row) : `row ${index + 1}`;
  }, [ids, rows, describeRow]);
  const position = (id: string | number) => `position ${ids.indexOf(String(id)) + 1} of ${ids.length}`;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
    onDragOver: ({ active, over }) => over ? `${nameOf(active.id)} is over ${position(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) => over ? `${nameOf(active.id)} was dropped at ${position(over.id)}.` : `${nameOf(active.id)} was dropped.`,
    onDragCancel: ({ active }) => `Reordering cancelled. ${nameOf(active.id)} was returned to its position.`,
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || locked) return;
    const moved = moveRowById(rows, getRowId, String(active.id), String(over.id));
    if (moved) onReorder(moved.rows, { id: String(active.id), from: moved.from, to: moved.to });
  };
  return { ids, locked, sensors, announcements, onDragEnd, nameOf };
}
