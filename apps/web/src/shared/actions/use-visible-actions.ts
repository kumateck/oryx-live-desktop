import { useMemo } from "react";
import { useAccess } from "../auth/use-access";
import type { ActionEntry, ActionItem } from "./action-items";

/** The actions the signed-in user may see. Hides what the server would refuse; it does not replace the server check. */
export function useVisibleActions(items: readonly ActionEntry[]): ActionItem[] {
  const access = useAccess();
  return useMemo(() => items.filter((item): item is ActionItem => Boolean(item)
    && (!item || !item.require || (typeof item.require === "string" ? access.has(item.require) : access.can(item.require)))), [items, access]);
}
