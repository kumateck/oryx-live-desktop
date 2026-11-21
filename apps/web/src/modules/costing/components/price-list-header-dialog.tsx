import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { FormDialog } from "@/shared/forms/form-dialog";
import type { WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePreparePriceListMutation, useRevisePriceListMutation, useUpdatePriceListMutation } from "../api/price-list-api";
import { calendarDate, dateOnly, divisionLabel, priceListAudit, priceListDetailPath, priceListHeaderSchema, priceListKeys,
  type PriceListDetail, type PriceListHeaderValues, type PriceListSummary } from "../lib/price-lists";

const fields: readonly WizardField<PriceListHeaderValues>[] = [
  { type: InputTypes.TEXT, name: "documentNumber", label: "Document number", required: true },
  { type: InputTypes.NUMBER, name: "revisionNumber", label: "Revision number", required: true, min: 0, step: 1 },
  { type: InputTypes.DATE, name: "effectiveFrom", label: "Effective from", required: true,
    description: "Approved prices apply from this date. Approval after this date takes effect when approved." },
  { type: InputTypes.TEXTAREA, name: "revisionReason", label: "Revision reason", required: true, className: "md:col-span-2" },
];

export function PriceListHeaderDialog({ division, source, editing = false, nextRevisionNumber, onClose, onSaved }: {
  division: 0 | 1; source: PriceListSummary | PriceListDetail | null; editing?: boolean; nextRevisionNumber?: number; onClose: () => void; onSaved?: () => void;
}) {
  const navigate = useNavigate();
  const key = editing ? priceListKeys.edit : source ? priceListKeys.revise : priceListKeys.create;
  const permission = usePermissionAction(key);
  const [prepare, preparing] = usePreparePriceListMutation();
  const [revise, revising] = useRevisePriceListMutation();
  const [update, updating] = useUpdatePriceListMutation();
  const [message, setMessage] = useState("");
  const tomorrow = source ? calendarDate(source.effectiveFrom) : new Date();
  if (source && !editing) tomorrow.setDate(tomorrow.getDate() + 1);
  const effective = tomorrow > new Date() ? tomorrow : new Date();
  const form = useForm<PriceListHeaderValues>({ resolver: zodResolver(priceListHeaderSchema), defaultValues: {
    documentNumber: source?.documentNumber ?? "", revisionNumber: editing && source ? source.revisionNumber : nextRevisionNumber ?? (source ? source.revisionNumber + 1 : 0),
    effectiveFrom: editing && source ? calendarDate(source.effectiveFrom) : effective, revisionReason: editing ? source?.revisionReason ?? "" : "",
  } });
  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const body = { ...values, division, effectiveFrom: dateOnly(values.effectiveFrom),
      previousRevisionId: editing ? source?.previousRevisionId ?? null : source?.id ?? null };
    setMessage("");
    if (editing && source) {
      const result = await update({ ...priceListAudit, id: source.id, domainEntitiesCostingUpdateCostingPriceListRequest: { ...body, version: source.version } });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      onSaved?.(); onClose(); return;
    }
    const result = source ? await revise({ ...priceListAudit, domainEntitiesCostingPrepareCostingPriceListRequest: body })
      : await prepare({ ...priceListAudit, domainEntitiesCostingPrepareCostingPriceListRequest: body });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    if (typeof result.data === "string") { onClose(); void navigate(priceListDetailPath(result.data)); }
  });
  return <FormDialog allowed={permission.allowed} title={editing ? "Correct revision header" : source ? "New price-list revision" : "Prepare price list"}
    description={`${divisionLabel(division)}. Each product packing style has its own price per complete pack. Saving prepares a draft for review.`}
    form={form} fields={fields} submitLabel={editing ? "Save correction" : "Prepare revision"}
    busy={preparing.isLoading || revising.isLoading || updating.isLoading} message={message}
    onSubmit={(event) => void submit(event)} onClose={onClose} />;
}
