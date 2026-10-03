import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useState } from "react";
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
import { approvalDefaults, approvalFormSchema, approvalPayload, newApprovalStage, type ApprovalConfiguration, type ApprovalValues } from "../schemas/approval-settings-schema";
import { ApprovalStage } from "./approval-stage";

export function ApprovalEditor({ record, onClose }: { record?: ApprovalConfiguration; onClose: () => void }) {
  const form = useForm<ApprovalValues>({ resolver: zodResolver(approvalFormSchema), defaultValues: approvalDefaults(record) });
  const stages = useFieldArray({ control: form.control, name: "stages" });
  const directory = useSettingsDirectories();
  const [create, creating] = approvalSettingsApi.usePostApiV1ApprovalMutation();
  const [update, updating] = approvalSettingsApi.usePutApiV1ApprovalByApprovalIdMutation();
  const [error, setError] = useState("");
  const fields: WizardField<ApprovalValues>[] = [{ type: InputTypes.SELECT, name: "document", label: "Approval document", source: "sync", mode: "single", options: documentOptions(record?.itemType), required: true }];
  const permission = usePermissionAction(record ? "CanEditApprovalWorkflow" : "CanCreateNewApproval");
  const save = form.handleSubmit(async (values) => {
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    if (directory.loading || directory.error) { setError(directory.error ?? "Wait for the approver directory."); return; }
    setError("");
    const arg = { ...approvalSettingsAudit, domainEntitiesApprovalsCreateApprovalRequest: approvalPayload(values) };
    const result = record ? await update({ ...arg, approvalId: record.id }) : await create(arg);
    if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
    toast.success(record ? "Approval workflow updated" : "Approval workflow created"); onClose();
  });
  return <SettingsEditorDialog allowed={permission.allowed} title={record ? "Edit approval workflow" : "Create approval workflow"} description="Stages run in the displayed order. Regulated routing policies require exactly one role."
    busy={creating.isLoading || updating.isLoading} dirty={form.formState.isDirty} error={error} onSave={save} onClose={onClose}>
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
