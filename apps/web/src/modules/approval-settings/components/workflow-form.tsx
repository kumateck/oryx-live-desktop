import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { settingsApi } from "@/shared/api/generated/settings";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { useGetApiV1ApprovalQuery, usePostApiV1ApprovalMutation, usePutApiV1ApprovalByApprovalIdMutation } from "../api/workflow-api";
import { audit, formatWait, isSingleRoleRoute, workflowDocumentOptions, workflowLabel, workflowsPath } from "../lib/workflows";
import { workflowFormSchema, workflowRowsSchema, type Workflow, type WorkflowFormValues } from "../schemas/workflow-schema";
import { StagesEditor } from "./stages-editor";

const { usePostApiV1CollectionMutation } = settingsApi;
const named = (items: readonly { id?: string | null; name?: string | null }[] | undefined): SelectOption[] => (items ?? []).flatMap((item) => item.id && item.name?.trim() ? [{ value: item.id, label: item.name.trim() }] : []);

/** Creates or edits the approval workflow of one kind of document. The document cannot be changed once the workflow exists. */
export function WorkflowForm({ workflow }: { workflow?: Workflow }) {
  const navigate = useNavigate();
  const [loadPeople, people] = usePostApiV1CollectionMutation();
  useEffect(() => { void loadPeople({ ...audit, body: ["Role", "User"] }); }, [loadPeople]);
  const roles = useMemo(() => named(people.data?.Role), [people.data]);
  const users = useMemo(() => named(people.data?.User), [people.data]);
  // The server allows one workflow per document; those already set up are shown as taken.
  const existing = useGetApiV1ApprovalQuery({ ...audit, page: 1, pageSize: 200 }, { skip: Boolean(workflow) });
  const taken = useMemo(() => { const parsed = workflowRowsSchema.safeParse(existing.data?.data ?? []); return new Set(parsed.success ? parsed.data.map((row) => row.type) : []); }, [existing.data]);
  const [create, creating] = usePostApiV1ApprovalMutation();
  const [update, updating] = usePutApiV1ApprovalByApprovalIdMutation();
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const form = useForm<WorkflowFormValues>({ resolver: zodResolver(workflowFormSchema), defaultValues: {
    document: workflow ? { value: workflow.type, label: workflowLabel(workflow.type) } : null, days: workflow?.wait?.days ?? 1, hours: workflow?.wait?.hours ?? 0, minutes: workflow?.wait?.minutes ?? 0,
    stages: workflow?.stages.length ? workflow.stages.map((stage) => ({ kind: stage.kind, approver: { value: stage.id, label: stage.name } })) : [{ kind: "role", approver: null }] } });
  // Read here so the form re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const document = useWatch({ control: form.control, name: "document" });
  const roleOnly = Boolean(document && isSingleRoleRoute(document.value));
  // A single-role route cannot keep stages a general workflow may have had.
  useEffect(() => { if (roleOnly) { const first = form.getValues("stages")[0]; form.setValue("stages", [{ kind: "role", approver: first?.kind === "role" ? first.approver : null }]); } }, [roleOnly, form]);
  const fields = useMemo((): WizardField<WorkflowFormValues>[] => [
    { type: InputTypes.SELECT, name: "document", label: "Document", mode: "single", source: "sync", required: true, disabled: Boolean(workflow), className: "md:col-span-3",
      options: workflowDocumentOptions.map((item) => taken.has(item.value) ? { ...item, label: `${item.label} (already has a workflow)`, disabled: true } : item),
      ...(workflow ? { description: "A workflow stays with its document. To move it, delete this one and create another." } : {}) },
    { type: InputTypes.NUMBER, name: "days", label: "Escalate after: days", min: 0, max: 365, step: 1, required: true },
    { type: InputTypes.NUMBER, name: "hours", label: "Hours", min: 0, max: 23, step: 1, required: true },
    { type: InputTypes.NUMBER, name: "minutes", label: "Minutes", min: 0, max: 59, step: 1, required: true },
  ], [taken, workflow]);

  const permission = usePermissionAction(workflow ? "CanEditApprovalWorkflow" : "CanCreateNewApproval");
  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setMessage("");
    if (!values.document) return;
    const body = { itemType: values.document.value, escalationDuration: formatWait(values),
      // Every stage is required, and the order is the order on the page.
      approvalStages: values.stages.flatMap((stage, index) => stage.approver ? [{ ...(stage.kind === "user" ? { userId: stage.approver.value } : { roleId: stage.approver.value }), required: true, order: index + 1 }] : []) };
    const result = workflow ? await update({ ...audit, approvalId: workflow.id, domainEntitiesApprovalsCreateApprovalRequest: body }) : await create({ ...audit, domainEntitiesApprovalsCreateApprovalRequest: body });
    if ("error" in result) { const reason = apiErrorMessage(result.error);
      if (/already exists/i.test(reason)) form.setError("document", { message: "This document already has a workflow" }); else setMessage(reason);
      return; }
    toast.success(workflow ? "Workflow updated" : "Workflow created", { description: workflowLabel(values.document.value) });
    setSaved(true);
    void navigate(workflowsPath);
  });
  const busy = creating.isLoading || updating.isLoading;

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 max-w-4xl space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty && !busy && !saved} />
    <PageHeader title={workflow ? `Edit workflow · ${workflowLabel(workflow.type)}` : "New approval workflow"} crumbs={[{ label: "Approvals", to: workflowsPath }, { label: workflow ? "Edit" : "New" }]}
      actions={<><Button type="button" variant="outline" disabled={busy} onClick={() => void navigate(workflowsPath)}>Cancel</Button><Button type="submit" disabled={busy || !permission.allowed}>{busy ? <><Spinner />Saving…</> : workflow ? "Save changes" : "Create workflow"}</Button></>} />
    {workflow ? <p role="note" className="rounded-md border bg-muted/50 p-3 text-sm">Changes apply to requests made from now on. Requests already waiting keep the approvers they were given.</p> : null}
    {people.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(people.error)} <Button type="button" size="sm" variant="link" onClick={() => void loadPeople({ ...audit, body: ["Role", "User"] })}>Retry</Button></p> : null}
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <section className="rounded-lg border bg-card p-4"><FormWizard form={form} fields={fields} className="md:grid-cols-3" />
      <p className="mt-2 text-xs text-muted-foreground">A stage that has not been decided in this time is escalated.</p></section>
    <StagesEditor form={form} roles={roles} users={users} loading={people.isLoading || people.isUninitialized} roleOnly={roleOnly} />
  </form>;
}
