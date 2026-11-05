import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SettingsFormDialog } from "@/modules/settings-support/ui";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { monthEndIso, monthOfIso } from "@/shared/batch-dates/batch-dates";
import { parseMonthYear } from "@/shared/date-pickers/date-utils";
import { InputTypes } from "@/shared/forms/input-types";
import type { WizardField } from "@/shared/forms/form-wizard";
import type { DomainEntitiesMaterialsBatchMaterialBatchDto } from "@/shared/api/generated/materials";
import { expiryApi as materialsApi } from "../api/expiry-api";

export const migrationRetestPermission = { kind: "all", permissions: ["CanUpdateMigrationRetestDate"] } as const;
const schema = z.object({
  date: z.string().refine((value) => parseMonthYear(value) !== null, "Select a valid month and year").nullable(),
  arNumber: z.string().trim().max(500),
  batchNumber: z.string().trim().max(500, "The batch number must be at most 500 characters"),
  reason: z.string().trim().min(3, "Record the reason for this correction").max(1000),
});
type Values = z.infer<typeof schema>;
const arFields: WizardField<Values>[] = [
  { type: InputTypes.TEXT, name: "arNumber", label: "AR number (optional)", description: "Enter the migration AR reference. Leave blank to clear it." },
  { type: InputTypes.TEXTAREA, name: "reason", label: "Correction reason", required: true },
];
const batchFields: WizardField<Values>[] = [
  { type: InputTypes.TEXT, name: "batchNumber", label: "Batch number", required: true, description: "Enter the supplier batch number exactly, for example one that the spreadsheet turned into a date." },
  { type: InputTypes.TEXTAREA, name: "reason", label: "Correction reason", required: true },
];
const fields: WizardField<Values>[] = [
  { type: InputTypes.MONTH, name: "date", label: "Retest date", description: "Valid through the end of the selected month. Leave empty to remove an incorrect extension. The original expiry stays recorded." },
  ...arFields,
];

export type MigrationCorrectionMode = "retest" | "ar-number" | "batch-number";
const titles: Record<MigrationCorrectionMode, string> = {
  retest: "Update migration retest date and AR number", "ar-number": "Update migration AR number", "batch-number": "Update migration batch number",
};
const descriptions: Record<MigrationCorrectionMode, string> = {
  retest: "Update the retest date, AR number, or both. Your reason and changes are kept in the audit trail.",
  "ar-number": "Correct the AR reference without changing the retest date. Your reason and changes are kept in the audit trail.",
  "batch-number": "Correct the batch number without changing the dates or the AR reference. The original import row is kept, and your reason and the change are kept in the audit trail.",
};

export function MigrationRetestDialog({ record, mode = "retest", onClose, onDone }: {
  record: DomainEntitiesMaterialsBatchMaterialBatchDto; mode?: MigrationCorrectionMode; onClose: () => void; onDone: () => void;
}) {
  const permission = usePermissionAction(migrationRetestPermission);
  const [save, mutation] = materialsApi.usePutApiV1MaterialBatchByBatchIdMigrationRetestDateMutation();
  const [message, setMessage] = useState("");
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: {
    date: monthOfIso(record.retestDate), arNumber: record.arNumber ?? "", batchNumber: record.batchNumber ?? "", reason: "",
  } });
  const submit = async (values: Values) => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    if (!record.id) { setMessage("Reload this batch before saving."); return; }
    if (mode === "batch-number" && !values.batchNumber) { form.setError("batchNumber", { message: "Enter the batch number" }); return; }
    // An unchanged month keeps the stored retest timestamp exactly, including absent or legacy dates.
    const dateChanged = mode === "retest" && values.date !== monthOfIso(record.retestDate);
    const newDate = dateChanged && values.date ? monthEndIso(values.date) : null;
    if (newDate && record.expiryDate && new Date(newDate).getTime() <= new Date(record.expiryDate).getTime()) {
      form.setError("date", { message: "The retest extension must be later than the original expiry." }); return;
    }
    const retestDate = dateChanged ? newDate : record.retestDate ?? null;
    const result = await save({ batchId: record.id, module: "Warehouse", subModule: "Expired Materials",
      domainEntitiesMaterialsBatchUpdateMigrationRetestDate: { retestDate,
        expectedRetestDate: record.retestDate ?? null, expectedExpiryDate: record.expiryDate ?? null,
        // Each action sends only the reference it corrects; an omitted reference is kept unchanged.
        ...(mode === "batch-number"
          ? { batchNumber: values.batchNumber, expectedBatchNumber: record.batchNumber ?? "" }
          : { arNumber: values.arNumber, expectedArNumber: record.arNumber ?? "" }),
        reason: values.reason } });
    if ("error" in result) setMessage(apiErrorMessage(result.error)); else onDone();
  };
  return <SettingsFormDialog title={titles[mode]} description={descriptions[mode]}
    form={form} fields={mode === "ar-number" ? arFields : mode === "batch-number" ? batchFields : fields} saving={mutation.isLoading} submitDisabled={!permission.allowed} message={message}
    submitLabel="Save changes" onSubmit={submit} onClose={onClose} />;
}
