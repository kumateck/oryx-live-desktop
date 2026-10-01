import type { DataTableSelection } from "../lib/types";
import { pageSelectionState, togglePageSelected, toggleRowSelected } from "../lib/selection";

/** Selection controls for the rows currently on screen. Null when the table has no selection. */
export function useRowSelection<TData>(selection: DataTableSelection<TData> | undefined, visible: readonly { id: string; original: TData }[]) {
  if (!selection) return null;
  const selectableIds = visible.filter((row) => selection.isSelectable?.(row.original) ?? true).map((row) => row.id);
  return {
    count: selection.selected.size,
    pageState: pageSelectionState(selection.selected, selectableIds),
    canSelectAny: selectableIds.length > 0,
    isSelected: (id: string) => selection.selected.has(id),
    canSelect: (id: string) => selectableIds.includes(id),
    toggleRow: (id: string) => selection.onChange(toggleRowSelected(selection.selected, id)),
    togglePage: () => selection.onChange(togglePageSelected(selection.selected, selectableIds)),
  };
}

export type RowSelectionControls = NonNullable<ReturnType<typeof useRowSelection>>;
