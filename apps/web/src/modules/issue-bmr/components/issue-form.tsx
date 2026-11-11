import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { issueBmrPermissions } from "../lib/issue-bmr";
import { bmrSize, type Bmr } from "../schemas/bmr-schema";
import { issueBounds, issueSchema, type IssueValues } from "../schemas/issue-schema";

/** QA confirms the batch number and months alongside the recorded batch size. Issuing is confirmed separately because it completes the production step. */
export function IssueForm({ bmr, suggestion, saving, saved, onIssue, onDone }: {
  bmr: Bmr; suggestion: { value: string | null; note: string | null }; saving: boolean; saved: boolean; onIssue: (values: IssueValues) => Promise<string | null>; onDone: () => void;
}) {
  const size = bmrSize(bmr);
  const bounds = issueBounds();
  const stem = bmr.batchStem;
  const storedNumber = bmr.batchNumber ?? suggestion.value ?? "";
  const suffix = stem && storedNumber.startsWith(stem) ? storedNumber.slice(stem.length) : "";
  const form = useForm<IssueValues>({ resolver: zodResolver(issueSchema), defaultValues: {
    batchNumber: stem ? (/^[0-9]+$/.test(suffix) ? suffix : "") : storedNumber,
    made: bmr.made, expires: bmr.expires, quantity: size.value, unit: size.unit ? { value: size.unit, label: size.unit } : null,
  } });
  const [pending, setPending] = useState<IssueValues | null>(null);
  const fields: WizardField<IssueValues>[] = [
    { type: InputTypes.TEXT, name: "batchNumber", label: stem ? `Batch number · ${stem}` : "Batch number", required: true, className: "md:col-span-2",
      ...(stem ? { inputMode: "numeric", description: `Enter the digits after ${stem}.` } : suggestion.note ? { description: suggestion.note } : {}) },
    { type: InputTypes.MONTH, name: "made", label: "Manufacturing month", required: true, minMonth: bounds.made.minMonth, maxMonth: bounds.made.maxMonth },
    { type: InputTypes.MONTH, name: "expires", label: "Expiry month", required: true, minMonth: bounds.expires.minMonth, maxMonth: bounds.expires.maxMonth },
  ];
  const submit = form.handleSubmit((values) => {
    if (stem && (!/^[0-9]+$/.test(values.batchNumber) || stem.length + values.batchNumber.length > 100)) {
      form.setError("batchNumber", { message: `Enter up to ${100 - stem.length} digits after the batch stem.` });
      return;
    }
    setPending({ ...values, batchNumber: (stem ?? "") + values.batchNumber });
  });
  return <form noValidate className="space-y-4" onSubmit={submit}>
    <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
    <dl className="grid gap-4 text-sm md:grid-cols-2">
      <div className="min-w-0">
        <dt className="text-muted-foreground">Batch size</dt>
        <dd className="break-words font-medium">{formatQuantityNumber(size.value, "entered")}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-muted-foreground">Unit</dt>
        <dd className="break-words font-medium">{size.unit || "–"}</dd>
      </div>
    </dl>
    <p className="text-sm"><span className="text-muted-foreground">Packing style: </span>{bmr.packing ?? "Not set on the schedule"}</p>
    <PermissionGuard require={issueBmrPermissions.issue}>
      <div className="flex justify-end"><Button type="submit" disabled={saving}>{saved ? "Retry issue" : "Issue BMR and BPR"}</Button></div>
    </PermissionGuard>
    {pending ? <ConfirmActionDialog require={issueBmrPermissions.issue} destructive={false} title={`Issue batch ${pending.batchNumber.trim()}?`}
      description="The batch details are saved and the manufacturing and packaging records are issued to production. The BMR step of the batch is marked complete."
      confirmLabel="Issue" busyLabel="Issuing…" onClose={() => setPending(null)} onConfirm={async () => { const problem = await onIssue(pending); if (!problem) onDone(); return problem; }} /> : null}
  </form>;
}
