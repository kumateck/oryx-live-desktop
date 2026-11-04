import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SettingsFormDialog } from "@/modules/settings-support/ui";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatMonthYear } from "@/shared/format/dates";
import { InputTypes } from "@/shared/forms/input-types";
import type { WizardField } from "@/shared/forms/form-wizard";
import { useReviewIssuedBmrRevisionMutation } from "../api/issued-bmr-api";
import { issuedBmrAction, issuedBmrAudit, issuedBmrPermissions } from "../lib/access";
import { reviewSchema, type Review, type Revision } from "../schemas/issued-bmr";

const fields: WizardField<Review>[] = [{ type: InputTypes.TEXTAREA, name: "reason", label: "Review reason", required: true, className: "md:col-span-2" }];
export function RevisionReviewDialog({ id, revision, approve, onClose, onDone }: {
  id: string; revision: Revision; approve: boolean; onClose: () => void; onDone: () => void;
}) {
  const permission = usePermissionAction(issuedBmrAction(issuedBmrPermissions.approve));
  const [save, mutation] = useReviewIssuedBmrRevisionMutation();
  const [message, setMessage] = useState("");
  const form = useForm<Review>({ resolver: zodResolver(reviewSchema), defaultValues: { reason: "" } });
  const submit = async (values: Review) => {
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const result = await save({ ...issuedBmrAudit, id, revisionId: revision.id,
      domainEntitiesProductsProductionReviewIssuedBmrRevision: { approve, reason: values.reason } });
    if ("error" in result) setMessage(apiErrorMessage(result.error)); else onDone();
  };
  const dates = `Manufacturing: ${formatMonthYear(revision.previousManufacturingDate) ?? "Not set"} → ${formatMonthYear(revision.manufacturingDate)}. Expiry: ${formatMonthYear(revision.previousExpiryDate) ?? "Not set"} → ${formatMonthYear(revision.expiryDate)}.`;
  return <SettingsFormDialog title={`${approve ? "Approve" : "Reject"} date revision · ${revision.batchNumber}`} description={`${dates} Requested reason: ${revision.reason}`}
    form={form} fields={fields} saving={mutation.isLoading} submitDisabled={!permission.allowed || revision.isRequester} message={message}
    submitLabel={approve ? "Approve revision" : "Reject revision"} onSubmit={submit} onClose={onClose} />;
}
