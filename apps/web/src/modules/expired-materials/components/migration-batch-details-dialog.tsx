import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SettingsFormDialog } from "@/modules/settings-support/ui";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { batchDatesIssue, monthEndIso, monthOfIso, monthStartIso } from "@/shared/batch-dates/batch-dates";
import { parseMonthYear } from "@/shared/date-pickers/date-utils";
import { InputTypes } from "@/shared/forms/input-types";
import type { WizardField } from "@/shared/forms/form-wizard";
import type { DomainEntitiesMaterialsBatchMaterialBatchDto } from "@/shared/api/generated/materials";
import { expiryApi } from "../api/expiry-api";

export const migrationBatchDetailsPermission = "CanUpdateMigrationBatchDetails";
const month = z.string().refine((value) => parseMonthYear(value) !== null, "Select a valid month and year").nullable();
const schema = z.object({
  made: month,
  expires: month,
  grnNumber: z.string().trim().max(500),
  reason: z.string().trim().min(3, "Record the reason for this correction").max(1000),
});
type Values = z.infer<typeof schema>;
const fields: WizardField<Values>[] = [
  { type: InputTypes.MONTH, name: "made", label: "Manufacturing date" },
  { type: InputTypes.MONTH, name: "expires", label: "Expiry date" },
  { type: InputTypes.TEXT, name: "grnNumber", label: "GRN number", description: "Enter the original goods receipt reference, if known." },
  { type: InputTypes.TEXTAREA, name: "reason", label: "Correction reason", required: true },
];

export function MigrationBatchDetailsDialog({ record, onClose, onDone }: {
  record: DomainEntitiesMaterialsBatchMaterialBatchDto; onClose: () => void; onDone: () => void;
}) {
  const permission = usePermissionAction(migrationBatchDetailsPermission);
  const [save, mutation] = expiryApi.usePutApiV1MaterialBatchByBatchIdMigrationDetailsMutation();
  const [message, setMessage] = useState("");
  const madeMonth = monthOfIso(record.manufacturingDate);
  const expiryMonth = monthOfIso(record.expiryDate);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: {
    made: madeMonth, expires: expiryMonth, grnNumber: record.migrationGrnNumber ?? "", reason: "",
  } });

  const submit = async (values: Values) => {
    if (!record.id) { setMessage("Reload this batch before saving."); return; }
    if (values.made !== madeMonth || values.expires !== expiryMonth) {
      const issue = batchDatesIssue(values.made, values.expires);
      if (issue) { form.setError(issue.field, { message: issue.message }); return; }
    }

    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const result = await save({
      batchId: record.id, module: "Warehouse", subModule: "Expired Materials",
      domainEntitiesMaterialsBatchUpdateMigrationBatchDetails: {
        manufacturingDate: values.made === madeMonth ? record.manufacturingDate ?? null : values.made && monthStartIso(values.made),
        expiryDate: values.expires === expiryMonth ? record.expiryDate ?? null : values.expires && monthEndIso(values.expires),
        grnNumber: values.grnNumber || null,
        expectedManufacturingDate: record.manufacturingDate ?? null,
        expectedExpiryDate: record.expiryDate ?? null,
        expectedGrnNumber: record.migrationGrnNumber ?? null,
        reason: values.reason,
      },
    });
    if ("error" in result) setMessage(apiErrorMessage(result.error));
    else onDone();
  };

  return <SettingsFormDialog title="Correct migrated batch details" description="Choose the manufacturing and expiry months and enter the original GRN reference. Your reason and changes are recorded in the audit trail."
    form={form} fields={fields} saving={mutation.isLoading} submitDisabled={!permission.allowed} message={message}
    submitLabel="Save changes" onSubmit={submit} onClose={onClose} />;
}
