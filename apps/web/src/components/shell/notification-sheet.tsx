import { useMemo, useState } from "react";
import { Bell, BellRing, Check, CheckCheck } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/shared/format/dates";
import { desktopPermission, requestDesktopPermission, type DesktopPermission } from "@/shared/notifications/announce";
import { notificationAudit, notificationListSchema, useGetApiV1AlertNotificationsQuery } from "@/shared/notifications/notification-api";
import { notificationLabel, notificationLink } from "@/shared/notifications/notification-types";
import { useNotifications } from "@/shared/notifications/use-notifications";

/** Notifications the user has already read, loaded only when asked for. */
function Earlier({ unreadIds, onNavigate }: { unreadIds: ReadonlySet<string>; onNavigate: () => void }) {
  const query = useGetApiV1AlertNotificationsQuery({ ...notificationAudit, unreadOnly: false });
  const read = useMemo(() => { const parsed = notificationListSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data.filter((item) => !unreadIds.has(item.id)) : []; }, [query.data, unreadIds]);
  if (query.isLoading) return <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Loading earlier notifications…</p>;
  if (read.length === 0) return <p className="text-sm text-muted-foreground">Nothing earlier.</p>;
  return <ul aria-label="Earlier notifications" className="space-y-2">{read.map((item) => { const to = notificationLink(item.type);
    return <li key={item.id} className="rounded-md border p-3 text-sm opacity-80"><p className="text-xs text-muted-foreground">{notificationLabel(item.type)}</p><p className="break-words">{item.message}</p>
      {to ? <Link to={to} onClick={onNavigate} className="text-xs text-primary underline-offset-2 hover:underline">Open</Link> : null}</li>; })}</ul>;
}

/** The bell in the header: how many notifications are unread, the list, and marking them read. New ones are announced as they arrive. */
export function NotificationSheet() {
  const [open, setOpen] = useState(false);
  const [earlier, setEarlier] = useState(false);
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState<DesktopPermission>(() => desktopPermission());
  const notifications = useNotifications(() => setOpen(true));
  const count = notifications.unread.length;
  const unreadIds = useMemo(() => new Set(notifications.unread.map((item) => item.id)), [notifications.unread]);

  const read = async (id: string) => { const failure = await notifications.read(id); if (failure) toast.error("Could not mark it as read", { description: failure }); };
  const readAll = async () => {
    setBusy(true);
    try { const result = await notifications.readAll(); if (result.failed) toast.error(`${result.done} marked as read; the rest could not be`, { description: result.failed }); }
    finally { setBusy(false); }
  };

  return <Sheet open={open} onOpenChange={(next) => { setOpen(next); if (!next) setEarlier(false); }}>
    <SheetTrigger asChild><Button type="button" size="icon-sm" variant="outline" className="header-action" aria-label={`Notifications${count ? `, ${count} unread` : ""}`}>
      {count > 0 ? <BellRing /> : <Bell />}{count > 0 && <span className="notification-count">{count > 99 ? "99+" : count}</span>}
    </Button></SheetTrigger>
    <SheetContent side="right" className="flex w-full max-w-sm flex-col gap-3">
      <SheetHeader><SheetTitle>Notifications</SheetTitle>
        <SheetDescription>{notifications.live ? "New notifications appear here as they are sent." : "Live updates are not connected; checking every minute."}</SheetDescription></SheetHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
        {permission === "default" ? <div className="rounded-md border bg-muted/50 p-3 text-sm"><p>Show notifications when this window is in the background?</p>
          <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => void requestDesktopPermission().then(setPermission)}>Turn on desktop notifications</Button></div> : null}
        {notifications.error ? <p role="alert" className="text-sm text-destructive">{notifications.error} <Button type="button" size="sm" variant="link" onClick={notifications.retry}>Retry</Button></p> : null}
        <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Unread ({count})</h3>
          {count > 1 ? <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void readAll()}>{busy ? <Spinner /> : <CheckCheck />}Mark all as read</Button> : null}</div>
        {notifications.loading ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Loading…</p>
          : count === 0 ? <p className="text-sm text-muted-foreground">You are up to date.</p>
          : <ul aria-label="Unread notifications" className="space-y-2">{notifications.unread.map((item) => { const to = notificationLink(item.type); const at = notifications.receivedAt.get(item.message);
            return <li key={item.id} className="flex items-start gap-2 rounded-md border bg-card p-3 text-sm">
              <div className="min-w-0 flex-1"><p className="text-xs font-medium text-muted-foreground">{notificationLabel(item.type)}{at ? ` · ${formatDateTime(at) ?? ""}` : ""}</p><p className="break-words">{item.message}</p>
                {to ? <Link to={to} onClick={() => setOpen(false)} className="text-xs text-primary underline-offset-2 hover:underline">Open</Link> : null}</div>
              <Button type="button" size="icon-sm" variant="ghost" disabled={busy} aria-label={`Mark as read: ${item.message}`} onClick={() => void read(item.id)}><Check /></Button></li>; })}</ul>}
        {earlier ? <Earlier unreadIds={unreadIds} onNavigate={() => setOpen(false)} /> : <Button type="button" size="sm" variant="outline" onClick={() => setEarlier(true)}>Show earlier notifications</Button>}
      </div>
    </SheetContent>
  </Sheet>;
}
