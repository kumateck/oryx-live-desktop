import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { relatedUnits } from "@/shared/units/quantity";
import { issueBmrPermissions } from "../lib/issue-bmr";
import { bmrSize, type Bmr } from "../schemas/bmr-schema";
import { issueBounds, issueSchema, type IssueValues } from "../schemas/issue-schema";

/** The details QA confirms before issuing: batch number, months, and batch size. Issuing is confirmed separately because it completes the production step. */
export function IssueForm({ bmr, suggestion, saving, saved, onIssue, onDone }: {
  bmr: Bmr; suggestion: { value: string | null; note: string | null }; saving: boolean; saved: boolean; onIssue: (values: IssueValues) => Promise<string | null>; onDone: () => void;
}) {
  const size = bmrSize(bmr);
  const units = relatedUnits(size.unit).map((unit) => ({ value: unit, label: unit }));
  const bounds = issueBounds();
  const form = useForm<IssueValues>({ resolver: zodResolver(issueSchema), defaultValues: {
    batchNumber: bmr.batchNumber ?? suggestion.value ?? "", made: bmr.made, expires: bmr.expires, quantity: size.value, unit: units.find((unit) => unit.value === size.unit) ?? units[0] ?? null,
  } });
  const [pending, setPending] = useState<IssueValues | null>(null);
  const fields: WizardField<IssueValues>[] = [
    { type: InputTypes.TEXT, name: "batchNumber", label: "Batch number", required: true, className: "md:col-span-2", ...(suggestion.note ? { description: suggestion.note } : {}) },
    { type: InputTypes.MONTH, name: "made", label: "Manufacturing month", required: true, minMonth: bounds.made.minMonth, maxMonth: bounds.made.maxMonth },
    { type: InputTypes.MONTH, name: "expires", label: "Expiry month", required: true, minMonth: bounds.expires.minMonth, maxMonth: bounds.expires.maxMonth },
    { type: InputTypes.NUMBER, name: "quantity", label: "Batch size", required: true, min: 0, step: 0.0001 },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "unit", label: "Unit", required: true, options: units },
  ];
  return <form noValidate className="space-y-4" onSubmit={(event) => void form.handleSubmit((values) => setPending(values))(event)}>
    <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
    <p className="text-sm"><span className="text-muted-foreground">Packing style: </span>{bmr.packing ?? "Not set on the schedule"}</p>
    <PermissionGuard require={issueBmrPermissions.issue}>
      <div className="flex justify-end"><Button type="submit" disabled={saving}>{saved ? "Retry issue" : "Issue BMR and BPR"}</Button></div>
    </PermissionGuard>
    {pending ? <ConfirmActionDialog require={issueBmrPermissions.issue} destructive={false} title={`Issue batch ${pending.batchNumber.trim()}?`}
      description="The batch details are saved and the manufacturing and packaging records are issued to production. The BMR step of the batch is marked complete."
      confirmLabel="Issue" busyLabel="Issuing…" onClose={() => setPending(null)} onConfirm={async () => { const problem = await onIssue(pending); if (!problem) onDone(); return problem; }} /> : null}
  </form>;
}
