import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { SettingsEditorDialog } from "@/modules/settings-support/ui";
import { useSettingsDirectories } from "@/modules/settings-support/directory";
import { delayFields } from "@/modules/settings-support/forms";
import { alertApi, alertAudit } from "../api/alert-api";
import { channelOptions, eventOptions } from "../lib/events";
import { alertDefaults, alertFormSchema, alertPayload, type AlertRecord, type AlertValues } from "../schemas/alert-schema";

export function AlertEditor({ record, recipientsOnly = false, onClose }: { record?: AlertRecord; recipientsOnly?: boolean; onClose: () => void }) {
  const form = useForm<AlertValues>({ resolver: zodResolver(alertFormSchema), defaultValues: alertDefaults(record) });
  const directory = useSettingsDirectories();
  const [create, creating] = alertApi.usePostApiV1AlertMutation();
  const [update, updating] = alertApi.usePutApiV1AlertByAlertIdMutation();
  const [error, setError] = useState("");
  const fields: WizardField<AlertValues>[] = [
    { type: InputTypes.TEXT, name: "title", label: "Title", required: true, disabled: recipientsOnly },
    { type: InputTypes.SELECT, name: "event", label: "Event", source: "sync", mode: "single", options: eventOptions, required: true, disabled: Boolean(record), ...(record ? { description: "An existing alert's event cannot be changed." } : {}) },
    { type: InputTypes.SELECT, name: "channels", label: "Delivery channels", source: "sync", mode: "multiple", options: channelOptions, required: true, disabled: recipientsOnly },
    { type: InputTypes.SELECT, name: "roles", label: "Recipient roles", source: "sync", mode: "multiple", options: directory.roles, disabled: directory.loading, description: "Choose roles, individual users, or both." },
    { type: InputTypes.SELECT, name: "users", label: "Recipient users", source: "sync", mode: "multiple", options: directory.users, disabled: directory.loading },
  ];
  const permission = usePermissionAction(record ? "CanEditAlerts" : "CanCreateNewAlerts");
  const save = form.handleSubmit(async (values) => {
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    if (directory.error || directory.loading) { setError(directory.error ?? "Wait for the recipient directory."); return; }
    setError("");
    const arg = { ...alertAudit, domainEntitiesAlertsCreateAlertRequest: alertPayload(values) };
    const result = record ? await update({ ...arg, alertId: record.id }) : await create(arg);
    if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
    toast.success(record ? "Alert updated" : "Alert created"); onClose();
  });
  return <SettingsEditorDialog allowed={permission.allowed} title={record ? recipientsOnly ? "Manage recipients" : "Edit alert" : "Create alert"}
    description="Configure delivery and recipients for an operational event." busy={creating.isLoading || updating.isLoading} dirty={form.formState.isDirty} error={error} onClose={onClose} onSave={save}>
    {directory.error ? <div role="alert"><p>{directory.error}</p><Button type="button" variant="outline" onClick={directory.retry}>Retry recipients</Button></div> : null}
    <FormWizard form={form} fields={fields} />
    {!recipientsOnly ? <div><h3 className="mb-2 font-medium">Delivery delay</h3><FormWizard form={form} fields={delayFields} className="grid-cols-2" /></div> : null}
  </SettingsEditorDialog>;
}
