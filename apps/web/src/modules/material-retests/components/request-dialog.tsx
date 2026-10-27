import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { materialsApi } from "@/shared/api/generated/materials";
import { qcApi } from "@/shared/api/generated/qc";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { InputTypes } from "@/shared/forms/input-types";
import type { WizardField } from "@/shared/forms/form-wizard";
import { SettingsFormDialog, SettingsRecordState } from "@/modules/settings-support/ui";
import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { retestAudit as audit, retestPath, retestPermissions as p } from "../schemas/retest";
const schema = z.object({ reason: z.string().trim().min(3).max(2000) });
type Values = z.infer<typeof schema>;
const fields: WizardField<Values>[] = [{ type: InputTypes.TEXTAREA, name: "reason", label: "Reason for retesting", required: true, rows: 4 }];
const batchSchema = z.object({ id: z.string().min(1), status: z.number().int(), retestDate: z.string().nullish(), expiryDate: z.string().nullish(), totalQuantity: z.number().finite().optional() });
type Batch = z.infer<typeof batchSchema>;
function RequestForm({ batch, onClose }: { batch: Batch; onClose: () => void }) {
  const navigate = useNavigate();
  const { has } = useAccess();
  const command = useVerifiedMutation<Batch>(p.request, batch);
  const [read] = materialsApi.useLazyGetApiV1MaterialBatchByBatchIdQuery();
  const [create] = qcApi.usePostApiV1QcMaterialRetestsBatchesByBatchIdMutation();
  const [message, setMessage] = useState("");
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { reason: "" } });
  const save = async (values: Values) => {
    const failure = await command.run(batch, async () => batchSchema.parse(await read({ ...audit, batchId: batch.id }, false).unwrap()), async (fresh) => {
      if (![3, 4, 8].includes(fresh.status) || fresh.retestDate) throw new Error("This batch is ineligible for a manual retest. Scheduled retests are created by the due-date scan.");
      const result = await create({ ...audit, batchId: batch.id, domainEntitiesMaterialsBatchCreateMaterialRetestRequest: { reason: values.reason } });
      if ("error" in result) throw new Error(apiErrorMessage(result.error));
      toast.success("Retest requested", { description: "The batch is held while the governed retest is completed." });
      onClose();
      if (has(p.detail)) void navigate(retestPath(result.data));
    });
    if (failure) setMessage(failure);
  };
  return <SettingsFormDialog title="Request material retest" description="This creates a governed approval request and holds the batch. Expiry changes only after an issued compliant certificate completes the linked retest."
    form={form} fields={fields} saving={command.busy} submitDisabled={command.attempted || !command.allowed} message={message} submitLabel="Request retest" onClose={onClose} onSubmit={save} />;
}
export function RequestMaterialRetestDialog({ batchId, onClose }: { batchId: string; onClose: () => void }) {
  const query = materialsApi.useGetApiV1MaterialBatchByBatchIdQuery({ ...audit, batchId });
  const parsed = batchSchema.safeParse(query.data);
  if (query.isLoading || query.error || !parsed.success) return <SettingsRecordState title="Request material retest" close={onClose} retry={() => void query.refetch()} error={query.error ? apiErrorMessage(query.error) : !query.isLoading ? "The batch could not be verified." : null} />;
  return <RequestForm batch={parsed.data} onClose={onClose} />;
}
