import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormDialog } from "@/shared/forms/form-dialog";
import type { WizardField } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { toLargestUnit, toSmallestUnit } from "@/shared/units/quantity";
import { usePutApiV1RequisitionByRequisitionIdItemsAndItemIdIssuedQuantityMutation } from "../api/stock-issue-api";
import { adjustIssuePermission, minimumReasonLength, suggestedIssue, toIssue } from "../lib/issue-quantity";
import { audit } from "../lib/stock-issue";
import type { StockLine } from "../schemas/stock-issue-schema";
import { amount } from "./batch-breakdown";

interface Values { quantity: number; reason: string }

/**
 * A warehouse supervisor sets how much of a packaging line is handed over when whole packs make it differ from the
 * requirement. Any difference needs a reason; entering the requirement again clears it.
 */
export function IssueQuantityDialog({ requisitionId, line, onClose }: { requisitionId: string; line: StockLine; onClose: () => void }) {
  const permission = usePermissionAction(adjustIssuePermission);
  const [save, saving] = usePutApiV1RequisitionByRequisitionIdItemsAndItemIdIssuedQuantityMutation();
  const [message, setMessage] = useState("");
  // Entered in the unit the requirement is shown in; the server stores the line's own unit.
  const unit = toLargestUnit(line.quantity, line.unit, "calculated")?.unit ?? line.unit ?? "";
  const shown = (value: number) => toLargestUnit(value, line.unit, "calculated")?.unit === unit ? toLargestUnit(value, line.unit, "calculated")?.value ?? value : value;
  const required = shown(line.quantity);
  // Back to the line's own unit: the server compares it with the requirement as stored.
  const inLineUnit = (value: number) => Number((toSmallestUnit(value, unit) / toSmallestUnit(1, line.unit)).toPrecision(12));
  const schema = z.object({ quantity: z.number({ error: "Enter the quantity to issue." }).finite("Enter the quantity to issue.").positive("Issue more than zero."), reason: z.string() })
    .refine((values) => values.quantity === required || values.reason.trim().length >= minimumReasonLength, { path: ["reason"], message: "Say why more or less than the requirement is issued." });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { quantity: shown(toIssue(line)), reason: line.adjustmentReason ?? "" } });
  const entered = useWatch({ control: form.control, name: "quantity" });
  const suggestion = suggestedIssue(line);
  const difference = Number.isFinite(entered) ? Number((entered - required).toPrecision(12)) : 0;
  const fields: WizardField<Values>[] = [
    { type: InputTypes.NUMBER, name: "quantity", label: `Quantity to issue (${unit})`, required: true, min: 0 },
    { type: InputTypes.TEXTAREA, name: "reason", label: "Reason", rows: 2, className: "md:col-span-2",
      description: "Required when more or less than the requirement is issued, for example sealed packs of 10." },
  ];
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const result = await save({ ...audit, requisitionId, itemId: line.id,
      domainEntitiesRequisitionsAdjustIssuedQuantityRequest: { quantity: values.quantity === required ? line.quantity : inLineUnit(values.quantity), reason: values.reason.trim() || null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(values.quantity === required ? `${line.materialName} will be issued as requested` : `${line.materialName} will be issued as ${values.quantity} ${unit}`);
    onClose();
  });
  return <FormDialog allowed={permission.allowed} title={`Quantity to issue · ${line.materialName}`} columns="md:grid-cols-2"
    description={`The requirement is ${amount(line.quantity, line.unit)}. Packs are issued whole, so what is handed over may be more or less; production returns any leftover through Final Packing.`}
    form={form} fields={fields} submitLabel="Save quantity" busy={saving.isLoading} message={message} onSubmit={(event) => void submit(event)} onClose={onClose}
    footnote={<div className="space-y-1 text-sm">
      {suggestion !== null ? <p>Nearest whole packs: <strong>{amount(suggestion, line.unit)}</strong>{" "}
        <Button type="button" size="sm" variant="outline" className="ml-1 h-7" onClick={() => form.setValue("quantity", shown(suggestion), { shouldValidate: true })}>Use</Button></p> : null}
      <p role="status" className={difference < 0 ? "text-destructive" : "text-muted-foreground"}>
        {difference === 0 ? "As requested." : difference > 0 ? `${difference} ${unit} over the requirement.` : `${-difference} ${unit} under the requirement.`}</p>
    </div>} />;
}
