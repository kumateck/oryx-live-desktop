import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquare, RefreshCw, RotateCcw, UserPlus, type LucideIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { useGetApiV1TicketsByIdActivityQuery, usePostApiV1TicketsByIdCommentsMutation } from "../api/ticket-api";
import { activityLabels, audit, statusLabels, ticketPermissions, type TicketStatus } from "../lib/tickets";
import { activitySchema, commentSchema, type CommentValues } from "../schemas/ticket-schema";

const icons: Record<number, LucideIcon> = { 0: MessageSquare, 1: RefreshCw, 2: UserPlus, 3: RotateCcw };
const fields: WizardField<CommentValues>[] = [{ type: InputTypes.TEXTAREA, name: "comment", label: "Add a comment", rows: 3, placeholder: "Write an update or a question" }];
const label = (status: number | null) => status === null ? null : statusLabels[status as TicketStatus] ?? null;

/** Everything that has happened on a ticket, newest first, and a box to add a comment. */
export function TicketActivityFeed({ ticketId }: { ticketId: string }) {
  const { has } = useAccess();
  const query = useGetApiV1TicketsByIdActivityQuery({ ...audit, id: ticketId });
  const entries = useMemo(() => { const parsed = activitySchema.safeParse(query.data ?? []); return parsed.success ? [...parsed.data].reverse() : []; }, [query.data]);
  const [add, mutation] = usePostApiV1TicketsByIdCommentsMutation();
  const [message, setMessage] = useState("");
  const form = useForm<CommentValues>({ resolver: zodResolver(commentSchema), defaultValues: { comment: "" } });
  void form.formState.errors;
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const result = await add({ ...audit, id: ticketId, domainEntitiesTicketsAddTicketCommentRequest: { comment: values.comment.trim() } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    form.reset({ comment: "" });
  });
  return <section aria-label="Activity" className="space-y-3 rounded-lg border bg-card p-4"><h2 className="text-sm font-semibold">Activity</h2>
    {has(ticketPermissions.comment) ? <form noValidate onSubmit={(event) => void submit(event)} className="space-y-2"><FormWizard form={form} fields={fields} />
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <Button type="submit" size="sm" disabled={mutation.isLoading}>{mutation.isLoading ? <><Spinner />Posting…</> : "Post comment"}</Button></form> : null}
    {query.isLoading ? <div role="status" aria-label="Loading activity" className="h-20 animate-pulse rounded-md bg-muted" />
      : query.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(query.error)} <Button type="button" size="sm" variant="link" onClick={() => void query.refetch()}>Retry</Button></p>
      : entries.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p>
      : <ol className="space-y-3">{entries.map((entry) => { const Icon = icons[entry.type] ?? RefreshCw; const from = label(entry.from); const to = label(entry.to);
        return <li key={entry.id} className="flex gap-3 text-sm"><span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted"><Icon className="size-3.5" /></span>
          <div className="min-w-0"><p><span className="font-medium">{entry.user}</span> <span className="text-muted-foreground">· {activityLabels[entry.type] ?? "Update"}{entry.type !== 0 && to ? `: ${from && from !== to ? `${from} to ` : ""}${to}` : ""} · {formatDateTime(entry.when) ?? "time not recorded"}</span></p>
            {entry.note ? <p className="whitespace-pre-wrap break-words">{entry.note}</p> : null}</div></li>; })}</ol>}
  </section>;
}
