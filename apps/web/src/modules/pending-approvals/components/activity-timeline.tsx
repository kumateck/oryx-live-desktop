import { Check, Clock, X } from "lucide-react";
import { cn } from "cn";
import { formatDateTime } from "@/shared/format/dates";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { logStatusLabels } from "../lib/approval-documents";
import type { ApprovalLog } from "../schemas/approval-schema";

/** What earlier approvers decided, oldest first, with what they wrote. */
export function ActivityTimeline({ logs }: { logs: readonly ApprovalLog[] }) {
  if (logs.length === 0) return <p className="text-sm text-muted-foreground">Nobody has acted on this request yet.</p>;
  return <ol aria-label="Approval history" className="space-y-3">{logs.map((log) => { const Icon = log.status === 1 ? Check : log.status === 2 ? X : Clock;
    return <li key={log.key} className="flex gap-3">
      <span aria-hidden="true" className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border", log.status === 1 && "border-primary bg-primary text-primary-foreground", log.status === 2 && "border-destructive bg-destructive text-white")}><Icon className="size-3.5" /></span>
      <div className="min-w-0 flex-1 rounded-md border bg-card p-3">
        <p className="text-sm"><span className="font-medium">{logStatusLabels[log.status] ?? "Recorded"}</span> by {log.by ?? "an unnamed user"}<span className="text-muted-foreground"> · {formatDateTime(log.at) ?? "date not recorded"}</span></p>
        {log.comments ? <RichTextView html={log.comments} className="mt-1 text-sm text-muted-foreground" /> : null}
      </div></li>; })}</ol>;
}
