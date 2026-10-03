import { useCallback, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldValues, type UseFormReturn } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmActionDialog } from "@/shared/actions";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { useLazyGetApiV1UserByPermissionQuery, usePostApiV1TicketsMutation, usePutApiV1TicketsByIdAssignMutation, usePutApiV1TicketsByIdReopenMutation } from "../api/ticket-api";
import { useTicketMoves } from "../hooks/use-ticket-moves";
import { audit, categoryLabels, optionsOf, priorityLabels, ticketPath, ticketPermissions, type TicketMove, type TicketScope } from "../lib/tickets";
import { assignSchema, reopenSchema, reportSchema, type AssignValues, type ReopenValues, type ReportValues, type Ticket } from "../schemas/ticket-schema";

/** The frame the ticket forms share: a title, the fields, the server's reason when it refuses, and the two buttons. */
function FormDialog<TValues extends FieldValues>({ title, description, form, fields, submitLabel, busy, message, onSubmit, onClose }: { title: string; description: string; form: UseFormReturn<TValues>; fields: readonly WizardField<TValues>[];
  submitLabel: string; busy: boolean; message: string; onSubmit: (event: React.FormEvent) => void; onClose: () => void }) {
  // Read here so the dialog re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); onSubmit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-3"><FormWizard form={form} fields={fields} />{message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? <><Spinner />Saving…</> : submitLabel}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

const reportFields: WizardField<ReportValues>[] = [
  { type: InputTypes.TEXT, name: "title", label: "Title", required: true, placeholder: "Short summary of the issue" },
  { type: InputTypes.SELECT, name: "category", label: "Category", mode: "single", source: "sync", options: optionsOf(categoryLabels), required: true, placeholder: "Select a category" },
  { type: InputTypes.SELECT, name: "priority", label: "Priority", mode: "single", source: "sync", options: optionsOf(priorityLabels), required: true, placeholder: "Select a priority" },
  { type: InputTypes.TEXTAREA, name: "description", label: "Description", required: true, rows: 5, placeholder: "Describe the issue in detail" },
];
/** Reports an IT issue, then opens it so the reporter can follow it. */
export function ReportIssueDialog({ scope, onClose }: { scope: TicketScope; onClose: () => void }) {
  const navigate = useNavigate();
  const [create, mutation] = usePostApiV1TicketsMutation();
  const [message, setMessage] = useState("");
  const form = useForm<ReportValues>({ resolver: zodResolver(reportSchema), defaultValues: { title: "", category: null, priority: null, description: "" } });
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    if (!values.category || !values.priority) return;
    const result = await create({ ...audit, domainEntitiesTicketsCreateTicketRequest: { title: values.title.trim(), description: values.description.trim(), category: Number(values.category.value) as 0 | 1 | 2 | 3 | 4, priority: Number(values.priority.value) as 0 | 1 | 2 | 3 } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Issue reported", { description: "The IT team has been told." });
    onClose();
    if (typeof result.data === "string" && result.data) void navigate(ticketPath(scope, result.data));
  });
  return <FormDialog title="Report an IT issue" description="Say what is wrong. The IT team assigns it and you can follow its progress." form={form} fields={reportFields} submitLabel="Report issue" busy={mutation.isLoading} message={message}
    onSubmit={(event) => void submit(event)} onClose={onClose} />;
}

/** Gives a ticket to an IT agent: someone who may see every ticket. */
export function AssignTicketDialog({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const [assign, mutation] = usePutApiV1TicketsByIdAssignMutation();
  const [load] = useLazyGetApiV1UserByPermissionQuery();
  const [message, setMessage] = useState("");
  const form = useForm<AssignValues>({ resolver: zodResolver(assignSchema), defaultValues: { agent: null } });
  const loadAgents = useCallback<SelectLoader>(async (search, page) => {
    const result = await load({ ...audit, permissionKey: [ticketPermissions.viewAll], searchQuery: search, page, pageSize: 20 });
    const data = result.data;
    return { options: (data?.data ?? []).flatMap((user) => user.id ? [{ value: user.id, label: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unnamed user" }] : []),
      hasNext: (data?.pageIndex ?? 1) < (data?.pageCount ?? 1), hasPrevious: (data?.pageIndex ?? 1) > 1 };
  }, [load]);
  const fields: WizardField<AssignValues>[] = [{ type: InputTypes.SELECT, name: "agent", label: "Assign to", mode: "single", source: "async", loadOptions: loadAgents, required: true, placeholder: "Search for an IT agent" }];
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    if (!values.agent) return;
    const result = await assign({ ...audit, id: ticket.id, domainEntitiesTicketsAssignTicketRequest: { assignedToId: values.agent.value } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(`${ticket.number} assigned to ${values.agent.label}`);
    onClose();
  });
  return <FormDialog title={`${ticket.assignee ? "Reassign" : "Assign"} ${ticket.number}`} description={ticket.assignee ? `It is with ${ticket.assignee.name} now.` : "Nobody is handling this ticket yet."} form={form} fields={fields}
    submitLabel={ticket.assignee ? "Reassign" : "Assign"} busy={mutation.isLoading} message={message} onSubmit={(event) => void submit(event)} onClose={onClose} />;
}

const reopenFields: WizardField<ReopenValues>[] = [{ type: InputTypes.TEXTAREA, name: "reason", label: "Reason", required: true, rows: 4, placeholder: "Why is this ticket being reopened?" }];
/** Sends a finished ticket back to be worked on, with the reason. */
export function ReopenTicketDialog({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const [reopen, mutation] = usePutApiV1TicketsByIdReopenMutation();
  const [message, setMessage] = useState("");
  const form = useForm<ReopenValues>({ resolver: zodResolver(reopenSchema), defaultValues: { reason: "" } });
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const result = await reopen({ ...audit, id: ticket.id, domainEntitiesTicketsReopenTicketRequest: { reason: values.reason.trim() } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(`${ticket.number} reopened`);
    onClose();
  });
  return <FormDialog title={`Reopen ${ticket.number}`} description="The ticket goes back to in progress and the reason is kept in its activity." form={form} fields={reopenFields} submitLabel="Reopen" busy={mutation.isLoading} message={message}
    onSubmit={(event) => void submit(event)} onClose={onClose} />;
}

const confirmText: Record<"start" | "done" | "close", { title: string; description: string; label: string }> = {
  start: { title: "Start work on", description: "The ticket moves to in progress and the reporter sees that work has begun.", label: "Start work" },
  done: { title: "Mark as done", description: "The ticket moves to done. The reporter can reopen it if the problem is not solved.", label: "Mark as done" },
  close: { title: "Close", description: "The ticket is closed. It can still be reopened with a reason.", label: "Close ticket" },
};
/** The dialog for one move on a ticket: a form for assigning and reopening, a confirmation for the rest. */
export function TicketMoveDialog({ move, ticket, onClose }: { move: TicketMove; ticket: Ticket; onClose: () => void }) {
  const { run } = useTicketMoves();
  if (move === "assign") return <AssignTicketDialog ticket={ticket} onClose={onClose} />;
  if (move === "reopen") return <ReopenTicketDialog ticket={ticket} onClose={onClose} />;
  const text = confirmText[move];
  return <ConfirmActionDialog require={move === "close" ? ticketPermissions.close : { kind: "authenticated" }} destructive={false} title={`${text.title} ${ticket.number}?`} description={text.description} confirmLabel={text.label} busyLabel="Saving…" onClose={onClose} onConfirm={() => run(move, ticket)} />;
}
