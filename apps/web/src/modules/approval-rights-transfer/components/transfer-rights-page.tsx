import { useCallback, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { approvalsApi } from "@/shared/api/generated/approvals";
import { identityApi } from "@/shared/api/generated/identity";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { addTags } from "@/shared/api/add-tags";

const { useGetApiV1ApprovalUsersWithPendingQuery, usePostApiV1ApprovalTransferRightsMutation } = approvalsApi.enhanceEndpoints({
  endpoints: { getApiV1ApprovalUsersWithPending: (definition) => { definition.providesTags = addTags(definition.providesTags, [{ type: "PendingApprovals", id: "all" }]); }, postApiV1ApprovalTransferRights: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : ["PendingApprovals"]); } } });
const { useLazyGetApiV1UserQuery } = identityApi;
const audit = { module: "Quality Assurance", subModule: "Approval Rights Transfer" } as const;

interface Person { id?: string | null | undefined; firstName?: string | null | undefined; lastName?: string | null | undefined; email?: string | null | undefined }
/** People as choices, by name, falling back to their email. */
export function userOptions(users: readonly Person[] | null | undefined): SelectOption[] {
  return (users ?? []).flatMap((user) => user.id ? [{ value: user.id, label: [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email?.trim() || "Unnamed user" }] : []);
}

const option = z.object({ value: z.string().min(1), label: z.string() });
export const transferSchema = z.object({
  from: option.nullable().refine((value): boolean => Boolean(value), "Choose who the approvals are taken from"),
  to: option.nullable().refine((value): boolean => Boolean(value), "Choose who takes them over"),
}).superRefine((values, context) => { if (values.from && values.to && values.from.value === values.to.value) context.addIssue({ code: "custom", path: ["to"], message: "Choose a different person" }); });
type TransferValues = z.infer<typeof transferSchema>;

/**
 * Hands one person's approval duties to another: everything waiting for them, and their place in every
 * approval workflow. For when an approver leaves or is away for long.
 */
export function TransferRightsPage() {
  const pending = useGetApiV1ApprovalUsersWithPendingQuery({ ...audit });
  const [loadUsers] = useLazyGetApiV1UserQuery();
  const [transfer] = usePostApiV1ApprovalTransferRightsMutation();
  const [confirming, setConfirming] = useState<{ from: SelectOption; to: SelectOption } | null>(null);
  const form = useForm<TransferValues>({ resolver: zodResolver(transferSchema), defaultValues: { from: null, to: null } });
  // Read here so the form re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const from = useWatch({ control: form.control, name: "from" });
  const fromOptions = useMemo(() => userOptions(pending.data), [pending.data]);
  // The server's filter is named "isActive" but means "is disabled"; false asks for accounts that can sign in.
  const loadActive = useCallback<SelectLoader>(async (search, page) => {
    const result = await loadUsers({ ...audit, isActive: false, page, pageSize: 20, searchQuery: search.trim() }).unwrap();
    return { options: userOptions(result.data).filter((user) => user.value !== from?.value), hasNext: Number(result.pageIndex) < Number(result.pageCount), hasPrevious: Number(result.pageIndex) > 1 };
  }, [loadUsers, from?.value]);
  const fields = useMemo((): WizardField<TransferValues>[] => [
    { type: InputTypes.SELECT, name: "from", label: "Take approvals from", mode: "single", source: "sync", options: fromOptions, required: true,
      placeholder: pending.isLoading ? "Loading…" : fromOptions.length ? "Select a person" : "Nobody has approvals waiting", description: "People with at least one request waiting for them." },
    { type: InputTypes.SELECT, name: "to", label: "Give them to", mode: "single", source: "async", loadOptions: loadActive, required: true, placeholder: "Search for a person", description: "Any active user." },
  ], [fromOptions, pending.isLoading, loadActive]);

  const submit = form.handleSubmit((values) => { if (values.from && values.to) setConfirming({ from: values.from, to: values.to }); });

  return <section className="min-w-0 max-w-3xl space-y-4">
    <div><p className="eyebrow">QUALITY ASSURANCE</p><h1 className="text-xl font-semibold">Transfer approval rights</h1>
      <p className="text-sm text-muted-foreground">Hand one person's approval duties to another, for when an approver leaves or is away for long.</p></div>
    <div role="note" className="space-y-1 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
      <p className="font-medium">A transfer does two things, and neither is undone from here.</p>
      <ul className="list-disc space-y-0.5 pl-5"><li>Every request waiting for the first person moves to the second.</li>
        <li>The second person replaces the first in every approval workflow, so future requests go to them too.</li></ul>
    </div>
    {pending.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(pending.error)} <Button type="button" size="sm" variant="link" onClick={() => void pending.refetch()}>Retry</Button></p> : null}
    <form noValidate onSubmit={(event) => void submit(event)} className="space-y-4 rounded-lg border bg-card p-4">
      <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
      <div className="flex justify-end"><Button type="submit"><ArrowRight />Transfer rights</Button></div>
    </form>
    {confirming ? <ConfirmActionDialog require={"CanTransferApprovalRights"} title={`Transfer ${confirming.from.label}'s approvals to ${confirming.to.label}?`}
      description={`Everything waiting for ${confirming.from.label} moves to ${confirming.to.label}, and ${confirming.to.label} replaces ${confirming.from.label} in every approval workflow. ${confirming.from.label} will no longer be asked to approve anything. To reverse it, the workflows have to be edited and the requests transferred back.`}
      confirmLabel="Transfer rights" busyLabel="Transferring…" onClose={() => setConfirming(null)} onConfirm={async () => {
        const result = await transfer({ ...audit, domainEntitiesApprovalsTransferApprovalRequest: { fromUserId: confirming.from.value, toUserId: confirming.to.value } });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Approval rights transferred", { description: `${confirming.to.label} now holds ${confirming.from.label}'s approvals.` });
        form.reset({ from: null, to: null });
        return null;
      }} /> : null}
  </section>;
}
