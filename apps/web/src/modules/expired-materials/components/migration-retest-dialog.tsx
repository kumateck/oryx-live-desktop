import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SettingsFormDialog } from "@/modules/settings-support/ui";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formDate, utcBoundary } from "@/shared/format/date-boundary";
import { InputTypes } from "@/shared/forms/input-types";
import type { WizardField } from "@/shared/forms/form-wizard";
import type { DomainEntitiesMaterialsBatchMaterialBatchDto } from "@/shared/api/generated/materials";
import { expiryApi as materialsApi } from "../api/expiry-api";

export const migrationRetestPermission = { kind: "all", permissions: ["CanUpdateMigrationRetestDate"] } as const;
const schema = z.object({ date: z.date().nullable(), reason: z.string().trim().min(3, "Record the reason for this correction").max(1000) });
type Values = z.infer<typeof schema>;
const fields: WizardField<Values>[] = [
  { type: InputTypes.DATE, name: "date", label: "Retest date", description: "Leave empty to remove an incorrect extension. The original expiry stays recorded." },
  { type: InputTypes.TEXTAREA, name: "reason", label: "Correction reason", required: true },
];

export function MigrationRetestDialog({ record, onClose, onDone }: {
  record: DomainEntitiesMaterialsBatchMaterialBatchDto; onClose: () => void; onDone: () => void;
}) {
  const permission = usePermissionAction(migrationRetestPermission);
  const [save, mutation] = materialsApi.usePutApiV1MaterialBatchByBatchIdMigrationRetestDateMutation();
  const [message, setMessage] = useState("");
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: {
    date: formDate(record.retestDate), reason: "",
  } });
  const submit = async (values: Values) => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    if (!record.id) { setMessage("Reload this batch before saving."); return; }
    if (values.date && record.expiryDate && new Date(utcBoundary(values.date)).getTime() <= new Date(record.expiryDate).getTime()) {
      form.setError("date", { message: "The retest extension must be later than the original expiry." }); return;
    }
    const result = await save({ batchId: record.id, module: "Warehouse", subModule: "Expired Materials",
      domainEntitiesMaterialsBatchUpdateMigrationRetestDate: { retestDate: values.date ? utcBoundary(values.date) : null,
        expectedRetestDate: record.retestDate ?? null, expectedExpiryDate: record.expiryDate ?? null, reason: values.reason } });
    if ("error" in result) setMessage(apiErrorMessage(result.error)); else onDone();
  };
  return <SettingsFormDialog title="Update migration retest date" description="Record the supplied extension for this opening-stock batch. Your reason and the date change are kept in the audit trail."
    form={form} fields={fields} saving={mutation.isLoading} submitDisabled={!permission.allowed} message={message}
    submitLabel="Save retest date" onSubmit={submit} onClose={onClose} />;
}
