import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { formatDateTime } from "@/shared/format/dates";
import { aiExtractionApi, aiExtractionAudit, aiExtractionPermission, keyFormSchema, keyRequest, providerLabels, type KeyFormValues, type ProviderStatus } from "../lib/ai-extraction";

export function ProviderCard({ status, active }: { status: ProviderStatus; active: boolean }) {
  const name = providerLabels[status.provider];
  const permission = usePermissionAction(aiExtractionPermission);
  const [saveKey, saving] = aiExtractionApi.usePutApiV1QcAiExtractionSettingsByProviderKeyMutation();
  const [activate, activating] = aiExtractionApi.usePutApiV1QcAiExtractionSettingsActiveMutation();
  const [message, setMessage] = useState("");
  const form = useForm<KeyFormValues>({ resolver: zodResolver(keyFormSchema), defaultValues: { model: status.model, apiKey: "" } });
  const fields: WizardField<KeyFormValues>[] = [
    { type: InputTypes.TEXT, name: "model", label: "Model", required: true, placeholder: "e.g. claude-opus-5-5" },
    { type: InputTypes.PASSWORD, name: "apiKey", label: "API key", autoComplete: "new-password", placeholder: status.hasKey ? "Leave blank to keep the current key" : "Paste the key",
      description: status.hasKey ? "The saved key is never shown again. Enter a new one only to replace it." : "Required before this provider can be activated." },
  ];
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const body = keyRequest(values);
    if (!status.hasKey && !body.apiKey) { form.setError("apiKey", { message: "Enter the key for this provider." }); return; }
    const result = await saveKey({ ...aiExtractionAudit, provider: status.provider, apiControllersSaveAiExtractionProviderKeyRequest: body });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(body.apiKey ? `${name} key saved` : `${name} model updated`);
    form.reset({ model: body.model, apiKey: "" });
  });
  const onActivate = async () => {
    setMessage("");
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const result = await activate({ ...aiExtractionAudit, apiControllersSetActiveAiExtractionProviderRequest: { provider: status.provider } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(`${name} is now the active provider`);
  };
  return <section aria-label={name} className="space-y-4 rounded-lg border bg-card p-4">
    <header className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-base font-semibold">{name}{active ? <Badge>Active</Badge> : null}{status.hasKey ? null : <Badge variant="secondary">Not configured</Badge>}</h2>
      <Button type="button" size="sm" variant="outline" disabled={!status.hasKey || active || activating.isLoading} onClick={() => void onActivate()}
        title={!status.hasKey ? "Save a key before activating this provider." : undefined}>{activating.isLoading ? <Spinner /> : null}{active ? "In use" : "Make active"}</Button>
    </header>
    {status.hasKey ? <p className="text-sm text-muted-foreground">Key ending <code>…{status.keyPreview ?? "????"}</code>
      {status.updatedByName ? ` · last set by ${status.updatedByName}${status.updatedAt ? ` on ${formatDateTime(status.updatedAt) ?? ""}` : ""}` : null}</p> : null}
    <form noValidate onSubmit={(event) => void submit(event)} className="space-y-3">
      <FormWizard form={form} fields={fields} />
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <div className="flex justify-end"><Button type="submit" size="sm" disabled={saving.isLoading}>{saving.isLoading ? <><Spinner />Saving…</> : "Save"}</Button></div>
    </form>
  </section>;
}
