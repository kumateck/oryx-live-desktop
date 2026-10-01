import { Fragment } from "react";
import { Link } from "react-router";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { ActionItem } from "./action-items";

function ItemBody({ item }: { item: ActionItem }) {
  const Icon = item.icon;
  return <>
    {Icon ? <Icon className="size-4" /> : null}
    <span className="min-w-0">
      <span className="block whitespace-nowrap">{item.label}</span>
      {item.disabled && item.disabledReason ? <span className="block max-w-56 whitespace-normal text-xs text-muted-foreground">{item.disabledReason}</span> : null}
    </span>
  </>;
}

/** The entries of an action menu. Shared by the row menu and the dropdown button so both behave the same. */
export function ActionMenuItems({ items }: { items: readonly ActionItem[] }) {
  return items.map((item, index) => <Fragment key={item.id}>
    {item.separated && index > 0 ? <DropdownMenuSeparator /> : null}
    {item.to !== undefined
      // The link is the menu item itself, so Enter, click, and "open in new tab" all work.
      ? <DropdownMenuItem asChild variant={item.destructive ? "destructive" : "default"} {...(item.disabled ? { disabled: true } : {})}>
        <Link to={item.to}><ItemBody item={item} /></Link></DropdownMenuItem>
      : <DropdownMenuItem variant={item.destructive ? "destructive" : "default"} {...(item.disabled ? { disabled: true } : {})} onSelect={item.onSelect}>
        <ItemBody item={item} /></DropdownMenuItem>}
  </Fragment>);
}
