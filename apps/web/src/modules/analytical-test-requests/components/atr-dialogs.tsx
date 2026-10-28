import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SettingsFormDialog } from "@/modules/settings-support/ui";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { WizardField } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { AssignmentsDialog } from "@/shared/qc/assignment-views";
import { formAssigneeSchema } from "@/shared/qc/assignments";
import { atrApi, atrFormsApi } from "../api/atr-api";
import { AtrStatus, atrAudit, atrPermissions } from "../lib/atr";
import type { Atr } from "../schemas/atr-schema";

const sampleSchema = z.object({
  containers: z.number({ message: "Enter the number of containers sampled." }).int("Use a whole number.").positive("Sample at least one container."),
  quantity: z.string().trim().min(1, "Enter the sample quantity."),
});
type SampleValues = z.infer<typeof sampleSchema>;
const sampleFields: WizardField<SampleValues>[] = [
  { type: InputTypes.NUMBER, name: "containers", label: "Containers sampled", required: true, min: 1, step: 1 },
  { type: InputTypes.TEXT, name: "quantity", label: "Sample quantity", required: true, placeholder: "e.g. 20 tablets" },
];

/** QA records the sample taken from the batch for QC. */
export function TakeSampleDialog({ atr, onClose }: { atr: Atr; onClose: () => void }) {
  const [update, updating] = atrApi.usePutApiV1QaAnalyticalTestsStatusByIdMutation();
  const permission = usePermissionAction(atrPermissions.sample);
  const form = useForm<SampleValues>({ resolver: zodResolver(sampleSchema), defaultValues: { containers: Number.NaN, quantity: "" } });
  const [message, setMessage] = useState("");
  return <SettingsFormDialog title={`Take a sample of ${atr.batchNumber ?? atr.product}`} description={`${atr.product} · the sample goes to QC for testing.`} form={form} fields={sampleFields}
    saving={updating.isLoading} message={message} submitLabel="Record sample" onClose={onClose}
    onSubmit={async (values) => {
      setMessage("");
      const denied = permission.check();
      if (denied) { setMessage(denied); return; }
      const result = await update({ ...atrAudit, id: atr.id, domainEntitiesAnalyticalTestRequestsUpdateAnalyticalTestRequest: { status: AtrStatus.Sampled, numberOfContainers: values.containers, sampledQuantity: values.quantity.trim() } });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success("Sample recorded");
      onClose();
    }} />;
}

const retestSchema = z.object({ expiry: z.date({ message: "Choose the new expiry date." }).nullable().refine((value): boolean => value !== null, "Choose the new expiry date.") });
type RetestValues = z.infer<typeof retestSchema>;

export function CompleteAtrRetestDialog({ atr, onClose }: { atr: Atr; onClose: () => void }) {
  const [complete, completing] = atrApi.usePostApiV1QaAnalyticalTestsCompleteRetestByIdMutation();
  const permission = usePermissionAction(atrPermissions.completeRetest);
  const form = useForm<RetestValues>({ resolver: zodResolver(retestSchema), defaultValues: { expiry: null } });
  const [message, setMessage] = useState("");
  const fields: WizardField<RetestValues>[] = [{ type: InputTypes.DATE, name: "expiry", label: "Extended expiry date", required: true, minDate: new Date() }];
  return <SettingsFormDialog title={`Complete the retest of ${atr.batchNumber ?? atr.product}`} description="The batch's expiry is extended to the new date." form={form} fields={fields}
    saving={completing.isLoading} message={message} submitLabel="Complete retest" onClose={onClose}
    onSubmit={async (values) => {
      setMessage("");
      const denied = permission.check();
      if (denied) { setMessage(denied); return; }
      if (!values.expiry) return;
      const result = await complete({ ...atrAudit, id: atr.id, extendedExpiryDate: values.expiry.toISOString() });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success("Retest completed");
      onClose();
    }} />;
}

export function AtrAssignmentsDialog({ atr, onClose }: { atr: Atr; onClose: () => void }) {
  const query = atrFormsApi.useGetApiV1FormAssigneesBmrByBmrIdQuery({ ...atrAudit, bmrId: atr.bmrId ?? "", ...(atr.stage === 0 || atr.stage === 1 || atr.stage === 2 ? { stage: atr.stage } : {}), ...(atr.stepId ? { productionActivityStepId: atr.stepId } : {}) });
  const parsed = useMemo(() => { const result = formAssigneeSchema.safeParse(query.data ?? null); return result.success ? result.data : null; }, [query.data]);
  return <AssignmentsDialog assignees={parsed} loading={query.isLoading} error={query.error ? apiErrorMessage(query.error) : null} onClose={onClose} />;
}
