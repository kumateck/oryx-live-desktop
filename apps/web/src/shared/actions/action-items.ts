import type { LucideIcon } from "lucide-react";
import type { AccessRule } from "../auth/access";

interface ActionBase {
  /** Identifies the action within its menu. */
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Shown in red; for actions that remove or block something. */
  destructive?: boolean;
  disabled?: boolean;
  /** Why the action is disabled, shown under its label so the user is not left guessing. */
  disabledReason?: string;
  /** A permission key or compound rule. Omission is reserved for actions available to every signed-in user. */
  require?: string | AccessRule;
  /** Draws a divider above this action, to set a group apart. */
  separated?: boolean;
}

/** One entry of an action menu: something to run, or a page to open. */
export type ActionItem = (ActionBase & { onSelect: () => void; to?: never }) | (ActionBase & { to: string; onSelect?: never });

/** Menus accept `condition && item`, so callers do not build arrays by hand. */
export type ActionEntry = ActionItem | false | null | undefined;
