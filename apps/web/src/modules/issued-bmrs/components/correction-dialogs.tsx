import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SettingsFormDialog } from "@/modules/settings-support/ui";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { monthEndIso, monthOfIso, monthStartIso } from "@/shared/batch-dates/batch-dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { InputTypes } from "@/shared/forms/input-types";
import type { WizardField } from "@/shared/forms/form-wizard";
import { useCorrectIssuedBmrBatchNumberMutation, useRequestIssuedBmrRevisionMutation } from "../api/issued-bmr-api";
import { issuedBmrAction, issuedBmrAudit, issuedBmrPermissions } from "../lib/access";
import { dateRevisionSchema, expectedBmr, numberCorrectionSchema, type DateRevision, type IssuedBmr, type NumberCorrection } from "../schemas/issued-bmr";

const numberFields: WizardField<NumberCorrection>[] = [
  { type: InputTypes.TEXT, name: "batchNumber", label: "Batch number", required: true },
  { type: InputTypes.TEXTAREA, name: "reason", label: "Correction reason", required: true, className: "md:col-span-2" },
];
const dateFields: WizardField<DateRevision>[] = [
  { type: InputTypes.MONTH, name: "made", label: "Manufacturing month", required: true },
  { type: InputTypes.MONTH, name: "expires", label: "Expiry month", required: true },
  { type: InputTypes.TEXTAREA, name: "reason", label: "Revision reason", required: true, className: "md:col-span-2" },
];
interface Props { row: IssuedBmr; onClose: () => void; onDone: () => void }

export function NumberCorrectionDialog({ row, onClose, onDone }: Props) {
  const permission = usePermissionAction(issuedBmrAction(issuedBmrPermissions.correct));
  const [save, mutation] = useCorrectIssuedBmrBatchNumberMutation();
  const [message, setMessage] = useState("");
  const form = useForm<NumberCorrection>({ resolver: zodResolver(numberCorrectionSchema), defaultValues: { batchNumber: row.batchNumber, reason: "" } });
  const submit = async (values: NumberCorrection) => {
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const result = await save({ ...issuedBmrAudit, id: row.id,
      domainEntitiesProductsProductionCorrectIssuedBmrNumber: { ...values, ...expectedBmr(row) } });
    if ("error" in result) setMessage(apiErrorMessage(result.error)); else onDone();
  };
  return <SettingsFormDialog title={`Correct batch number · ${row.batchNumber}`} description="Correct a typing error in this issued BMR. Linked live batch information is updated and the previous number is retained in history. Issued certificates require separate revision."
    form={form} fields={numberFields} saving={mutation.isLoading} submitDisabled={!permission.allowed} message={message}
    submitLabel="Save typo correction" onSubmit={submit} onClose={onClose} />;
}

export function DateRevisionDialog({ row, onClose, onDone }: Props) {
  const permission = usePermissionAction(issuedBmrAction(issuedBmrPermissions.revise));
  const [save, mutation] = useRequestIssuedBmrRevisionMutation();
  const [message, setMessage] = useState("");
  const form = useForm<DateRevision>({ resolver: zodResolver(dateRevisionSchema), defaultValues: {
    made: monthOfIso(row.manufacturingDate) ?? "", expires: monthOfIso(row.expiryDate) ?? "", reason: "",
  } });
  const submit = async (values: DateRevision) => {
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const result = await save({ ...issuedBmrAudit, id: row.id, domainEntitiesProductsProductionRequestIssuedBmrRevision: {
      ...expectedBmr(row), manufacturingDate: monthStartIso(values.made), expiryDate: monthEndIso(values.expires), reason: values.reason,
    } });
    if ("error" in result) setMessage(apiErrorMessage(result.error)); else onDone();
  };
  return <SettingsFormDialog title={`Request date revision · ${row.batchNumber}`} description="The current dates stay in use until someone else with approval permission approves this revision. Approval updates linked live batch information; issued certificates retain their own revision history."
    form={form} fields={dateFields} saving={mutation.isLoading} submitDisabled={!permission.allowed} message={message}
    submitLabel="Request revision" onSubmit={submit} onClose={onClose} />;
}
