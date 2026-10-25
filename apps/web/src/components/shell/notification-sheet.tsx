import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { desktopPermission, requestDesktopPermission, type DesktopPermission } from "@/shared/notifications/announce";
import { NotificationList } from "@/shared/notifications/notification-list";
import { useNotifications } from "@/shared/notifications/use-notifications";
import { notificationLink } from "@/shared/notifications/notification-types";

/** The bell in the header: how many notifications are unread, the list, and marking them read. New ones are announced as they arrive. */
export function NotificationSheet() {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState<DesktopPermission>(() => desktopPermission());
  const navigate = useNavigate();
  const notifications = useNotifications((id, direct, shipmentDocumentId, type) => {
    const target = direct && type !== undefined && type !== null ? notificationLink(type, shipmentDocumentId) : undefined;
    if (target) { setOpen(false); setSelectedId(undefined); navigate(target); return; }
    setSelectedId(id); setOpen(true);
  });
  const count = notifications.unread.length;
  const nativeAlerts = Boolean(window.oryxCompanion?.notify);

  const read = async (id: string) => { const failure = await notifications.read(id); if (failure) toast.error("Could not mark it as read", { description: failure }); };
  const readAll = async () => {
    setBusy(true);
    try { const result = await notifications.readAll(); if (result.failed) toast.error(`${result.done} marked as read; the rest could not be`, { description: result.failed }); }
    finally { setBusy(false); }
  };

  return <Sheet open={open} onOpenChange={(next) => { setOpen(next); if (!next) setSelectedId(undefined); }}>
    <SheetTrigger asChild><Button type="button" size="icon-sm" variant="outline" className="header-action" aria-label={`Notifications${count ? `, ${count} unread` : ""}`}>
      {count > 0 ? <BellRing /> : <Bell />}{count > 0 && <span className="notification-count">{count > 99 ? "99+" : count}</span>}
    </Button></SheetTrigger>
    <SheetContent side="right" className="flex w-full max-w-sm flex-col gap-3">
      <SheetHeader><SheetTitle>Notifications</SheetTitle>
        <SheetDescription>{notifications.live ? "New notifications appear here as they are sent." : "Live updates are not connected; checking every minute."}</SheetDescription></SheetHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
        {nativeAlerts ? <p className="text-xs text-muted-foreground">System alerts use your operating system’s notification settings. Missed alerts remain here until you mark them read.</p> : permission === "default" ? <div className="rounded-md border bg-muted/50 p-3 text-sm"><p>Show system notifications while you work?</p>
          <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => void requestDesktopPermission().then(setPermission)}>Turn on desktop notifications</Button></div> : null}
        {notifications.error ? <p role="alert" className="text-sm text-destructive">{notifications.error} <Button type="button" size="sm" variant="link" onClick={notifications.retry}>Retry</Button></p> : null}
        <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Unread ({count})</h3>
          {count > 1 ? <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void readAll()}>{busy ? <Spinner /> : <CheckCheck />}Mark all as read</Button> : null}</div>
        <NotificationList notifications={notifications} {...(selectedId ? { selectedId } : {})} busy={busy} onRead={(id) => void read(id)} onNavigate={() => { setOpen(false); setSelectedId(undefined); }} />

      </div>
    </SheetContent>
  </Sheet>;
}
