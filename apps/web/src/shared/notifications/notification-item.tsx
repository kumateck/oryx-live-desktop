import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/shared/format/dates";
import { notificationLabel, notificationLink } from "./notification-types";
import type { Unread } from "./arrivals";
export function NotificationItem({ item, selected = false, at, busy = false, onRead, onNavigate }: {
  item: Unread; selected?: boolean; at?: string; busy?: boolean; onRead?: (id: string) => void; onNavigate: () => void;
}) {
  const row = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (!selected) return;
    row.current?.focus({ preventScroll: true }); row.current?.scrollIntoView?.({ block: "nearest" });
  }, [selected]);
  const to = notificationLink(item.type);
  return <li ref={row} tabIndex={selected ? -1 : undefined} aria-label={selected ? "Selected notification" : undefined}
    className={`flex items-start gap-2 rounded-md border bg-card p-3 text-sm outline-none ${selected ? "ring-2 ring-foreground/60 ring-offset-2 ring-offset-background" : ""}`}>
    <div className="min-w-0 flex-1"><p className="text-xs font-medium text-muted-foreground">{notificationLabel(item.type)}{at ? ` · ${formatDateTime(at) ?? ""}` : ""}</p><p className="break-words">{item.message}</p>
      {to ? <Link to={to} onClick={onNavigate} className="text-xs text-foreground underline decoration-primary decoration-2 underline-offset-4">Open</Link> : null}</div>
    {onRead ? <Button type="button" size="icon-sm" variant="ghost" disabled={busy} aria-label={`Mark as read: ${item.message}`} onClick={() => onRead(item.id)}><Check /></Button> : null}
  </li>;
}
