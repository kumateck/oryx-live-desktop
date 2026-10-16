import { useCallback, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserRoundCheck } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmActionDialog } from "@/shared/actions/confirm-action-dialog";
import { identityApi } from "@/shared/api/generated/identity";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { useDelegateApprovalsMutation, useGetMyDelegationsQuery, useRevokeDelegationMutation } from "../api/delegation-api";
import { approvalPermissions, audit } from "../lib/approval-documents";
import { delegationFormSchema, delegationRequest, maximumDays, myDelegationsSchema, type Delegation, type DelegationFormValues } from "../lib/delegation";

const { useLazyGetApiV1UserQuery } = identityApi;
const today = () => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()); };

function DelegateDialog({ onClose }: { onClose: () => void }) {
  const me = useCurrentUser();
  const [loadUsers] = useLazyGetApiV1UserQuery();
  const [delegate] = useDelegateApprovalsMutation();
  const [message, setMessage] = useState("");
  const [first] = useState(today);
  const form = useForm<DelegationFormValues>({ resolver: zodResolver(delegationFormSchema), defaultValues: { delegate: null, start: first, end: null, reason: "" } });
  // Read here so the form re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const [chosen, start, end] = useWatch({ control: form.control, name: ["delegate", "start", "end"] });
  // The server's filter is named "isActive" but means "is disabled"; false asks for accounts that can sign in.
  const loadPeople = useCallback<SelectLoader>(async (search, page) => {
    const result = await loadUsers({ ...audit, isActive: false, page, pageSize: 20, searchQuery: search.trim() }).unwrap();
    return { options: (result.data ?? []).flatMap((user) => user.id && user.id !== me?.id ? [{ value: user.id, label: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || "Unnamed user" }] : []),
      hasNext: Number(result.pageIndex) < Number(result.pageCount), hasPrevious: Number(result.pageIndex) > 1 };
  }, [loadUsers, me?.id]);
  const last = useMemo(() => start ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + maximumDays - 1) : undefined, [start]);
  const fields = useMemo((): WizardField<DelegationFormValues>[] => [
    { type: InputTypes.SELECT, name: "delegate", label: "Who decides for you", mode: "single", source: "async", loadOptions: loadPeople, required: true, placeholder: "Search for a person", className: "md:col-span-2" },
    { type: InputTypes.DATE, name: "start", label: "First day", required: true, minDate: first },
    { type: InputTypes.DATE, name: "end", label: "Last day", required: true, minDate: start ?? first, ...(last ? { maxDate: last } : {}) },
    { type: InputTypes.TEXTAREA, name: "reason", label: "Reason (optional)", className: "md:col-span-2" },
  ], [loadPeople, first, start, last]);
  const busy = form.formState.isSubmitting;
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const result = await delegate(delegationRequest(values));
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Approvals delegated", { description: `${values.delegate?.label ?? "They"} can decide your approvals from ${formatDate(values.start?.toISOString())}.` });
    onClose();
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader><DialogTitle>Delegate my approvals</DialogTitle>
        <DialogDescription>For a period of up to {maximumDays} days, someone else sees the approvals waiting for you and may decide them. You can still decide them yourself, and end the delegation at any time.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-3">
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          {chosen && start && end ? <p role="status" className="rounded-md border bg-muted/50 p-3 text-sm">From {formatDate(start.toISOString())} to the end of {formatDate(end.toISOString())}, <span className="font-medium">{chosen.label}</span> can approve or reject what waits for you. Each decision is recorded as yours, with a note that they made it. QC documents that are signed electronically are not included.</p> : null}
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? <><Spinner />Delegating…</> : "Delegate"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

function DelegationRow({ delegation, given, onEnd }: { delegation: Delegation; given: boolean; onEnd: (ending: { delegation: Delegation; given: boolean }) => void }) {
  return <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
    <div className="min-w-0 space-y-0.5">
      <p className="break-words"><span className="font-medium">{given ? delegation.to : delegation.from}</span>
        <span className="text-muted-foreground"> · {formatDateTime(delegation.startsAt)} to {formatDateTime(delegation.endsAt)}</span></p>
      {delegation.reason ? <p className="break-words text-muted-foreground">{delegation.reason}</p> : null}
    </div>
    <div className="flex items-center gap-2"><Badge variant={delegation.status === "Active" ? "default" : "outline"}>{delegation.status}</Badge>
      {delegation.open ? <Button type="button" size="sm" variant="outline" onClick={() => onEnd({ delegation, given })}>{given ? "End" : "Give back"}</Button> : null}</div>
  </li>;
}

/**
 * The signed-in user's approval delegations: to whom their approvals are handed, and whose approvals they
 * are deciding. Any approver may delegate; the server has no permission for it.
 */
export function DelegationPanel() {
  const query = useGetMyDelegationsQuery();
  const [revoke] = useRevokeDelegationMutation();
  const [creating, setCreating] = useState(false);
  const [ending, setEnding] = useState<{ delegation: Delegation; given: boolean } | null>(null);
  const mine = useMemo(() => { const parsed = myDelegationsSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : { given: [], received: [] }; }, [query.data]);
  return <section aria-labelledby="delegation-heading" className="space-y-3 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 id="delegation-heading" className="text-sm font-semibold">Delegation</h2>
        <p className="text-sm text-muted-foreground">Hand your approvals to someone while you are away.</p></div>
      <Button type="button" size="sm" variant="outline" onClick={() => setCreating(true)}><UserRoundCheck />Delegate my approvals</Button>
    </div>
    {query.isLoading ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Loading delegations…</p> : null}
    {query.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(query.error)} <Button type="button" size="sm" variant="link" onClick={() => void query.refetch()}>Retry</Button></p> : null}
    {mine.given.length ? <div className="space-y-2"><h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your approvals handed to</h3>
      <ul className="space-y-2">{mine.given.map((item) => <DelegationRow key={item.id} delegation={item} given onEnd={setEnding} />)}</ul></div> : null}
    {mine.received.length ? <div className="space-y-2"><h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Approvals handed to you by</h3>
      <ul className="space-y-2">{mine.received.map((item) => <DelegationRow key={item.id} delegation={item} given={false} onEnd={setEnding} />)}</ul></div> : null}
    {creating ? <DelegateDialog onClose={() => setCreating(false)} /> : null}
    {ending ? <ConfirmActionDialog title={ending.given ? `End the delegation to ${ending.delegation.to}?` : `Give ${ending.delegation.from}'s approvals back?`}
      description={ending.given ? `${ending.delegation.to} stops seeing and deciding your approvals now. Decisions already taken stand.` : `You stop seeing and deciding ${ending.delegation.from}'s approvals now. Decisions already taken stand.`}
      confirmLabel={ending.given ? "End delegation" : "Give back"} busyLabel="Ending…" require={approvalPermissions.view} onClose={() => setEnding(null)}
      onConfirm={async () => { const result = await revoke(ending.delegation.id); return "error" in result ? apiErrorMessage(result.error) : null; }} /> : null}
  </section>;
}
