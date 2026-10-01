import type { ComponentProps } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ActionEntry } from "./action-items";
import { ActionMenuItems } from "./action-menu-items";
import { useVisibleActions } from "./use-visible-actions";

type ButtonProps = ComponentProps<typeof Button>;

/**
 * A button that opens a list of related actions ("Add" then a choice of what to add).
 * Renders nothing when the user may use none of them, so callers need no permission check of their own.
 */
export function DropdownButton({ label, icon: Icon, items, variant = "outline", size = "sm", align = "end", disabled = false }: {
  label: string;
  icon?: LucideIcon;
  items: readonly ActionEntry[];
  variant?: NonNullable<ButtonProps["variant"]>;
  size?: NonNullable<ButtonProps["size"]>;
  align?: "start" | "end";
  disabled?: boolean;
}) {
  const visible = useVisibleActions(items);
  if (visible.length === 0) return null;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button type="button" variant={variant} size={size} disabled={disabled}>{Icon ? <Icon /> : null}{label}<ChevronDown className="opacity-60" /></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align={align}><ActionMenuItems items={visible} /></DropdownMenuContent>
  </DropdownMenu>;
}
