import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ActionEntry } from "./action-items";
import { ActionMenuItems } from "./action-menu-items";
import { useVisibleActions } from "./use-visible-actions";

/**
 * The actions for one table row, behind a "more" button. `label` names the row for screen
 * readers ("Actions for Albendazole"). Renders nothing when the user may use none of the actions.
 */
export function TableMenu({ label, items, disabled = false }: { label: string; items: readonly ActionEntry[]; disabled?: boolean }) {
  const visible = useVisibleActions(items);
  if (visible.length === 0) return null;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {/* A row may open its record when clicked; opening the menu must not. */}
      <Button type="button" size="icon-sm" variant="ghost" aria-label={label} disabled={disabled} onClick={(event) => event.stopPropagation()}><MoreHorizontal /></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}><ActionMenuItems items={visible} /></DropdownMenuContent>
  </DropdownMenu>;
}

/** The header of a row-actions column: nothing to see, but named for screen readers. */
export function TableMenuHeader() { return <span className="sr-only">Actions</span>; }
