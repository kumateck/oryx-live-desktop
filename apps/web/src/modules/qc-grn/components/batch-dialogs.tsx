import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SelectOption, WizardField } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { arNumber, arNumberPrefix, useNextSerial } from "@/shared/qc/qc-numbers";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { relatedUnits, toLargestUnit, toSmallestUnit } from "@/shared/units/quantity";
import { SettingsFormDialog } from "@/modules/settings-support/ui";
import { qcGrnAnalyticalApi, qcGrnMaterialsApi } from "../api/qc-grn-api";
import { qcGrnAudit, qcPermissions } from "../lib/qc-grn";
import type { QcBatch } from "../schemas/grn-schema";

const sampleSchema = z.object({
  arNumber: z.string().trim().min(1, "Enter the AR number."),
  quantity: z.number({ message: "Enter the sample quantity." }).positive("The sample quantity must be more than zero."),
  unit: z.custom<SelectOption>().nullable().refine((value): boolean => value !== null, "Choose the unit."),
});
type SampleValues = z.infer<typeof sampleSchema>;

/** Records the sample QC takes from a batch in quarantine, under a new AR number. The sample cannot be more than was received. */
export function SampleDialog({ grnId, batch, kind, onClose }: { grnId: string; batch: QcBatch; kind: MaterialKind; onClose: () => void }) {
  const [create, creating] = qcGrnAnalyticalApi.usePostApiV1MaterialSamplingsMutation();
  const permission = usePermissionAction(qcPermissions.sample[kind]);
  const nextSerial = useNextSerial();
  const units = relatedUnits(batch.unit).map((unit) => ({ value: unit, label: unit }));
  const form = useForm<SampleValues>({ resolver: zodResolver(sampleSchema), defaultValues: { arNumber: "", quantity: Number.NaN, unit: units[0] ?? null } });
  const [message, setMessage] = useState("");
  useEffect(() => {
    const prefix = arNumberPrefix(kind === 1 ? "PM" : "RM", new Date().getFullYear());
    void nextSerial("ArNumberMaterial", prefix).then((serial) => { if (serial !== null && !form.getValues("arNumber")) form.setValue("arNumber", arNumber(prefix, serial)); });
  }, [form, kind, nextSerial]);
  const fields: WizardField<SampleValues>[] = [
    { type: InputTypes.TEXT, name: "arNumber", label: "AR number", required: true, description: "Suggested from the numbers already given this year. Check it before saving.", className: "md:col-span-2" },
    { type: InputTypes.NUMBER, name: "quantity", label: "Sample quantity", required: true, min: 0, step: 0.0001 },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "unit", label: "Unit", required: true, options: units },
  ];
  return <SettingsFormDialog title={`Sample ${batch.material}`} description={`Batch ${batch.number ?? "without a number"} · received ${toLargestUnit(batch.received, batch.unit, "calculated")?.text ?? "–"}`}
    form={form} fields={fields} saving={creating.isLoading} message={message} submitLabel="Record sample" onClose={onClose}
    onSubmit={async (values) => {
      setMessage("");
      const denied = permission.check();
      if (denied) { setMessage(denied); return; }
      const sampleQuantity = toSmallestUnit(values.quantity, values.unit?.value);
      if (sampleQuantity > batch.received) { form.setError("quantity", { message: "The sample cannot be more than the quantity received." }); return; }
      const result = await create({ ...qcGrnAudit, domainEntitiesMaterialSamplingCreateMaterialSamplingRequest: { grnId, materialBatchId: batch.id, arNumber: values.arNumber.trim(), sampleQuantity } });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success("Sample recorded");
      onClose();
    }} />;
}

const requestSchema = z.object({ reason: z.string().trim().min(1, "Give the reason for the retest.").max(2000) });
type RequestValues = z.infer<typeof requestSchema>;
const requestFields: WizardField<RequestValues>[] = [{ type: InputTypes.TEXTAREA, name: "reason", label: "Reason", required: true, rows: 4, className: "md:col-span-2" }];

export function RequestRetestDialog({ batch, kind, onClose }: { batch: QcBatch; kind: MaterialKind; onClose: () => void }) {
  const [request, requesting] = qcGrnMaterialsApi.usePostApiV1MaterialBatchByBatchIdRequestRetestMutation();
  const permission = usePermissionAction(qcPermissions.requestRetest[kind]);
  const form = useForm<RequestValues>({ resolver: zodResolver(requestSchema), defaultValues: { reason: "" } });
  const [message, setMessage] = useState("");
  return <SettingsFormDialog title={`Request a retest of ${batch.number ?? batch.material}`} description="The batch goes back to QC for retesting." form={form} fields={requestFields}
    saving={requesting.isLoading} message={message} submitLabel="Request retest" onClose={onClose}
    onSubmit={async (values) => {
      setMessage("");
      const denied = permission.check();
      if (denied) { setMessage(denied); return; }
      const result = await request({ ...qcGrnAudit, batchId: batch.id, domainEntitiesMaterialsBatchRequestRetestDto: { reason: values.reason.trim() } });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success("Retest requested");
      onClose();
    }} />;
}

const completeSchema = z.object({ expiry: z.date({ message: "Choose the new expiry date." }).nullable().refine((value): boolean => value !== null, "Choose the new expiry date."), notes: z.string().max(2000) });
type CompleteValues = z.infer<typeof completeSchema>;

/** Records that a retest is complete and the batch's new expiry date, which must be later than today. */
export function CompleteRetestDialog({ batch, kind, onClose }: { batch: QcBatch; kind: MaterialKind; onClose: () => void }) {
  const [complete, completing] = qcGrnMaterialsApi.usePostApiV1MaterialBatchByBatchIdCompleteRetestMutation();
  const permission = usePermissionAction(qcPermissions.completeRetest[kind]);
  const form = useForm<CompleteValues>({ resolver: zodResolver(completeSchema), defaultValues: { expiry: null, notes: "" } });
  const [message, setMessage] = useState("");
  const fields: WizardField<CompleteValues>[] = [
    { type: InputTypes.DATE, name: "expiry", label: "Extended expiry date", required: true, minDate: new Date() },
    { type: InputTypes.TEXTAREA, name: "notes", label: "Notes", rows: 3 },
  ];
  return <SettingsFormDialog title={`Complete the retest of ${batch.number ?? batch.material}`} description="The batch's expiry is extended to the new date." form={form} fields={fields}
    saving={completing.isLoading} message={message} submitLabel="Complete retest" onClose={onClose}
    onSubmit={async (values) => {
      setMessage("");
      const denied = permission.check();
      if (denied) { setMessage(denied); return; }
      if (!values.expiry) return;
      const result = await complete({ ...qcGrnAudit, batchId: batch.id, domainEntitiesMaterialsBatchCompleteRetestDto: { extendedExpiryDate: values.expiry.toISOString(), notes: values.notes.trim() || null } });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success("Retest completed");
      onClose();
    }} />;
}
