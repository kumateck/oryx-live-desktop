import { createContext, useContext, type ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "cn";
import { TableCell, TableRow } from "@/components/ui/table";
import type { DataTableRowSlot } from "../lib/types";

export interface DragRows { locked: boolean; nameOf: (id: string) => string }
export const DragRowsContext = createContext<DragRows>({ locked: true, nameOf: () => "row" });

// Declared once at module level so rows keep their identity (and keyboard focus) across reorders.
function SortableRow({ id, className, children }: { id: string; className?: string | undefined; children: ReactNode }) {
  const { locked, nameOf } = useContext(DragRowsContext);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: locked });
  return <TableRow ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}
    className={cn(isDragging && "relative z-10 bg-muted shadow-sm", className)}>
    <TableCell className="w-10">
      <button ref={setActivatorNodeRef} type="button" disabled={locked} aria-label={`Reorder ${nameOf(id)}`}
        className="flex size-7 cursor-grab touch-none items-center justify-center rounded text-muted-foreground hover:bg-muted focus-visible:outline-2 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
        {...attributes} {...listeners}><GripVertical aria-hidden="true" className="size-4" /></button>
    </TableCell>
    {children}
  </TableRow>;
}

export const sortableRowSlot: DataTableRowSlot = { leadingHeader: <span className="sr-only">Reorder</span>, Row: SortableRow };
