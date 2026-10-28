import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useLayoutEffect, useRef, useState } from "react";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { SettingsEditorDialog } from "@/modules/settings-support/ui";
import { useSettingsDirectories } from "@/modules/settings-support/directory";
import { delayFields } from "@/modules/settings-support/forms";
import { approvalSettingsApi, approvalSettingsAudit } from "../api/approval-settings-api";
import { documentOptions } from "../lib/documents";
import { approvalDefaults, approvalFormSchema, approvalPayload, approvalRepairRecordSchema, newApprovalStage, type ApprovalConfiguration, type ApprovalValues } from "../schemas/approval-settings-schema";
import { ApprovalStage } from "./approval-stage";

export function ApprovalEditor({ record, onClose, repairing = false }: { record?: ApprovalConfiguration; onClose: () => void; repairing?: boolean }) {
  const form = useForm<ApprovalValues>({ resolver: zodResolver(approvalFormSchema), defaultValues: approvalDefaults(record) });
  const stages = useFieldArray({ control: form.control, name: "stages" });
  const directory = useSettingsDirectories();
  const [create, creating] = approvalSettingsApi.usePostApiV1ApprovalMutation();
  const [update, updating] = approvalSettingsApi.usePutApiV1ApprovalByApprovalIdMutation();
  const [read, reading] = approvalSettingsApi.useLazyGetApiV1ApprovalByApprovalIdQuery();
  const saving = useRef(false);
  const actor = useCurrentUser()?.id ?? null;
  const currentActor = useRef(actor);
  useLayoutEffect(() => { currentActor.current = actor; }, [actor]);
  const [error, setError] = useState("");
  const fields: WizardField<ApprovalValues>[] = [{ type: InputTypes.SELECT, name: "document", label: "Approval document", source: "sync", mode: "single", options: documentOptions(record?.itemType), required: true, disabled: repairing }];
  const permission = usePermissionAction(record ? "CanEditApprovalWorkflow" : "CanCreateNewApproval");
  const save = form.handleSubmit(async (values) => {
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    if (directory.loading || directory.error) { setError(directory.error ?? "Wait for the approver directory."); return; }
    if (values.stages.some((stage) => stage.type === "Role" ? !directory.roles.some((role) => role.value === stage.role?.value) : !directory.users.some((user) => user.value === stage.user?.value))) {
      setError("Choose current approvers from the directory before saving."); return;
    }
    if (saving.current) return;
    saving.current = true;
    setError("");
    try {
      if (repairing && record) {
        const fresh = await read({ ...approvalSettingsAudit, approvalId: record.id }, false);
        if (fresh.error) { setError(apiErrorMessage(fresh.error)); return; }
        const current = approvalRepairRecordSchema.safeParse(fresh.data);
        if (!current.success || JSON.stringify(current.data) !== JSON.stringify(record)) { setError("This workflow changed. Reopen it before saving a repair."); return; }
      }
      const revoked = permission.check();
      if (revoked) { setError(revoked); return; }
      if (!actor || currentActor.current !== actor) { setError("The signed-in user changed. Reopen this workflow before saving."); return; }
      const arg = { ...approvalSettingsAudit, domainEntitiesApprovalsCreateApprovalRequest: approvalPayload(values) };
      const result = record ? await update({ ...arg, approvalId: record.id }) : await create(arg);
      if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
      toast.success(record ? "Approval workflow updated" : "Approval workflow created"); onClose();
    } finally { saving.current = false; }
  });
  return <SettingsEditorDialog allowed={permission.allowed} title={record ? "Edit approval workflow" : "Create approval workflow"} description="Stages run in the displayed order. Regulated routing policies require exactly one role."
    busy={creating.isLoading || updating.isLoading || reading.isFetching} dirty={form.formState.isDirty} error={error} onSave={save} onClose={onClose}>
    {repairing ? <p role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">Review every retained stage and choose its approver. Required flags and the escalation delay are retained. Saving numbers stages in the displayed order, starting at 1, and keeps the same document key. Existing document approvals are unchanged.</p> : null}
    <FormWizard form={form} fields={fields} />
    <div><h3 className="mb-2 font-medium">Escalation delay</h3><FormWizard form={form} fields={delayFields} className="grid-cols-2" /></div>
    {directory.error ? <div role="alert"><p>{directory.error}</p><Button type="button" variant="outline" onClick={directory.retry}>Retry approvers</Button></div> : null}
    <div className="space-y-3"><h3 className="font-medium">Approval stages</h3>
      {stages.fields.map((stage, index) => <ApprovalStage key={stage.id} form={form} index={index} count={stages.fields.length} roles={directory.roles} users={directory.users} disabled={directory.loading} move={stages.move} remove={stages.remove} />)}
      {form.formState.errors.stages?.root?.message || form.formState.errors.stages?.message ? <p role="alert" className="text-sm text-destructive">{form.formState.errors.stages.root?.message || form.formState.errors.stages.message}</p> : null}
      <Button type="button" variant="outline" onClick={() => stages.append(newApprovalStage())}>Add approval stage</Button>
    </div>
  </SettingsEditorDialog>;
}
