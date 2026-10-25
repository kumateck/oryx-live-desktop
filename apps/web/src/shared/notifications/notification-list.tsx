import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { NotificationItem } from "./notification-item";
import { notificationAudit, notificationListSchema, useGetApiV1AlertNotificationsQuery } from "./notification-api";
import type { useNotifications } from "./use-notifications";
type Notifications = Pick<ReturnType<typeof useNotifications>, "unread" | "receivedAt" | "loading">;
interface ListProps { notifications: Notifications; selectedId?: string; busy: boolean; onRead: (id: string) => void; onNavigate: () => void }
function LoadingNotifications() {
  return <div role="status" aria-label="Loading notifications" className="space-y-2">{[0, 1, 2].map((row) => <Skeleton key={row} className="h-20 w-full" />)}</div>;
}
function UnreadNotifications({ notifications, selectedId, busy, onRead, onNavigate }: ListProps) {
  if (notifications.loading) return <LoadingNotifications />;
  if (notifications.unread.length === 0) return <p className="text-sm text-muted-foreground">You are up to date.</p>;
  return <ul aria-label="Unread notifications" className="space-y-2">{notifications.unread.map((item) => {
    const at = item.sentAt ?? notifications.receivedAt.get(item.id) ?? notifications.receivedAt.get(item.message);
    return <NotificationItem key={item.id} item={item} selected={item.id === selectedId} {...(at ? { at } : {})} busy={busy} onRead={onRead} onNavigate={onNavigate} />;
  })}</ul>;
}
function EarlierNotifications({ unreadIds, selectedId, onNavigate }: { unreadIds: ReadonlySet<string>; selectedId?: string; onNavigate: () => void }) {
  const query = useGetApiV1AlertNotificationsQuery({ ...notificationAudit, unreadOnly: false });
  const read = useMemo(() => {
    const parsed = notificationListSchema.safeParse(query.data ?? null);
    return parsed.success ? parsed.data.filter((item) => !unreadIds.has(item.id)) : [];
  }, [query.data, unreadIds]);
  if (query.isLoading) return <LoadingNotifications />;
  if (query.isError) return <p role="alert" className="text-sm text-destructive">Notification history could not be loaded. <Button size="sm" variant="link" onClick={() => void query.refetch()}>Retry</Button></p>;
  if (read.length === 0) return <p role="status" className="text-sm text-muted-foreground">{selectedId ? "This alert is not in the available notification history." : "Nothing earlier."}</p>;
  return <><p className="text-xs text-muted-foreground">Previously read alerts</p>
    {selectedId && !read.some((item) => item.id === selectedId) ? <p role="status" className="text-sm text-muted-foreground">This alert is not in the available notification history.</p> : null}
    <ul aria-label="Earlier notifications" className="space-y-2">{read.map((item) => <NotificationItem key={item.id} item={item} selected={item.id === selectedId} {...(item.sentAt ? { at: item.sentAt } : {})} onNavigate={onNavigate} />)}</ul></>;
}
export function NotificationList(props: ListProps) {
  const [earlier, setEarlier] = useState(false);
  const unreadIds = useMemo(() => new Set(props.notifications.unread.map((item) => item.id)), [props.notifications.unread]);
  const requestedHistory = Boolean(props.selectedId && !unreadIds.has(props.selectedId));
  return <><UnreadNotifications {...props} />{earlier || requestedHistory
    ? <EarlierNotifications unreadIds={unreadIds} {...(props.selectedId ? { selectedId: props.selectedId } : {})} onNavigate={props.onNavigate} />
    : <Button type="button" size="sm" variant="outline" onClick={() => setEarlier(true)}>Show earlier notifications</Button>}</>;
}
