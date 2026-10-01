import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export interface HeaderNotification { id: string; title: string; message: string; sentAt: string; read: boolean }

export function NotificationSheet({ notifications, onMarkRead }: { notifications: readonly HeaderNotification[]; onMarkRead?: ((id: string) => void) | undefined }) {
  const unread = notifications.filter((item) => !item.read).length;
  return <Sheet><SheetTrigger asChild><Button type="button" size="icon-sm" variant="outline" className="header-action" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
    <Bell />{unread > 0 && <span className="notification-count">{unread > 99 ? "99+" : unread}</span>}
  </Button></SheetTrigger>
    <SheetContent side="right" className="w-full max-w-sm"><SheetHeader><SheetTitle>Notifications</SheetTitle><SheetDescription>Recent updates from your customer server.</SheetDescription></SheetHeader>
      <div className="notification-list">{notifications.length === 0 ? <p>No notifications yet.</p> : notifications.map((item) => <article key={item.id} className="notification-item">
        <div><strong>{item.title}</strong><p>{item.message}</p><time dateTime={item.sentAt}>{new Date(item.sentAt).toLocaleString()}</time></div>
        {!item.read && onMarkRead && <Button type="button" size="icon-xs" variant="ghost" aria-label={`Mark ${item.title} as read`} onClick={() => onMarkRead(item.id)}><Check /></Button>}
      </article>)}</div>
    </SheetContent>
  </Sheet>;
}
