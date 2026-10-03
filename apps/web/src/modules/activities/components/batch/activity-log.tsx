import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/shared/auth/user-avatar";
import { formatDateTime } from "@/shared/format/dates";
import { duration } from "../../lib/activity-progress";
import type { Activity } from "../../schemas/activity-schema";

const recent = 8;

/** What has happened on the run, newest first. */
export function ActivityLog({ logs }: { logs: Activity["logs"] }) {
  const [all, setAll] = useState(false);
  const shown = all ? logs : logs.slice(0, recent);
  return <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
    <h2 className="text-sm font-semibold">Activity <span className="font-normal text-muted-foreground">({logs.length})</span></h2>
    {logs.length === 0 ? <p className="text-sm text-muted-foreground">Nothing has been recorded yet.</p>
      : <ol className="space-y-3">{shown.map((log) => { const ago = duration(log.at); return <li key={log.id} className="flex min-w-0 gap-2">
        <UserAvatar user={log.user} size="sm" />
        <div className="min-w-0 text-sm"><p className="break-words"><span className="font-medium">{log.user?.name ?? "System"}</span> <span className="text-muted-foreground">{log.message}</span></p>
          <p className="text-xs text-muted-foreground" title={formatDateTime(log.at) ?? undefined}>{ago ? `${ago} ago` : formatDateTime(log.at) ?? ""}</p></div>
      </li>; })}</ol>}
    {logs.length > recent ? <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => setAll((value) => !value)}>{all ? "Show recent only" : `Show all ${logs.length}`}</Button> : null}
  </section>;
}
