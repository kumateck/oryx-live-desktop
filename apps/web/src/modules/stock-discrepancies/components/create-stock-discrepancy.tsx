import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { materialsApi } from "@/shared/api/generated/materials";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { ConfirmActionDialog } from "@/shared/actions";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { RecordState } from "@/shared/workflows/record-state";
import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { shelfSchema, stockDiscrepancyAudit as audit, stockDiscrepancyPath, discrepancyReasons } from "../schemas/discrepancy";
const choice = z.object({ value: z.string().min(1), label: z.string() });
export const stockCountFormSchema = z.object({ shelf: choice.nullable().refine((value): boolean => value !== null, "Choose a shelf batch"),
  count: z.number().finite().nonnegative(), reason: z.enum(["0", "1", "2", "3", "4", "5", "6"]), notes: z.string().trim().min(10).max(10000),
});
type Values = z.infer<typeof stockCountFormSchema>;
function CountForm({ shelves }: { shelves: z.infer<typeof shelfSchema>[] }) {
  const navigate = useNavigate();
  const form = useForm<Values>({ resolver: zodResolver(stockCountFormSchema), defaultValues: { shelf: null, count: Number.NaN, reason: "0", notes: "" } });
  const selected = useWatch({ control: form.control, name: "shelf" });
  const count = useWatch({ control: form.control, name: "count" });
  const shelf = shelves.find((row) => row.id === selected?.value);
  const [review, setReview] = useState<{ values: Values; shelf: z.infer<typeof shelfSchema> } | null>(null);
  const command = useVerifiedMutation<z.infer<typeof shelfSchema>>("CanRecordStockDiscrepancy");
  const [read] = materialsApi.useLazyGetApiV1MaterialShelfQuery();
  const [create] = warehouseApi.usePostApiV1StockDiscrepancyMutation();
  const fields: WizardField<Values>[] = [
    { type: InputTypes.SELECT, name: "shelf", label: "Batch and shelf", mode: "single", source: "sync", required: true, options: shelves.map((row) => ({ value: row.id, label: `${row.materialBatch.material?.name ?? "Material"} · ${row.materialBatch.batchNumber ?? "Batch"} · ${row.warehouseLocationShelf?.name ?? "Shelf"} · ${formatQuantityNumber(row.quantity, "entered")} ${row.uoM?.symbol ?? ""}` })) },
    { type: InputTypes.NUMBER, name: "count", label: `Physical count${shelf?.uoM?.symbol ? ` (${shelf.uoM.symbol})` : " (shelf unit)"}`, min: 0, step: 0.000001, required: true },
    { type: InputTypes.RADIO, name: "reason", label: "Reason", options: discrepancyReasons.map((label, value) => ({ value: String(value), label })) },
    { type: InputTypes.TEXTAREA, name: "notes", label: "Observation and investigation notes", required: true, rows: 4 },
  ];
  const submit = form.handleSubmit((values) => {
    if (!shelf || values.count === shelf.quantity) { form.setError("count", { message: "Record a count that differs from the system" }); return; }
    setReview({ values: structuredClone(values), shelf: structuredClone(shelf) });
  });
  return <form noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty && !command.attempted} />
    <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
    {shelf && Number.isFinite(count) ? <p role="status">Recorded: {formatQuantityNumber(shelf.quantity, "entered")} {shelf.uoM?.symbol}. Variance: {formatQuantityNumber(count - shelf.quantity, "calculated")} {shelf.uoM?.symbol}.</p> : null}
    <p className="text-sm text-muted-foreground">Reporting preserves the count snapshot. Only an approved reconciliation changes inventory.</p>
    <Button type="submit">Review report</Button>
    {review ? <ConfirmActionDialog title="Submit this physical count?" description={`Recorded ${formatQuantityNumber(review.shelf.quantity, "entered")}; counted ${formatQuantityNumber(review.values.count, "entered")} ${review.shelf.uoM?.symbol ?? ""}. ${review.values.notes}`}
      confirmLabel="Send for approval" busyLabel="Verifying…" destructive={false} require="CanRecordStockDiscrepancy" onClose={() => setReview(null)} onConfirm={async () => command.run(review.shelf, async () => {
        const rows = shelfSchema.array().parse(await read(audit, false).unwrap());
        const fresh = rows.find((row) => row.id === review.shelf.id);
        if (!fresh) throw new Error("This shelf batch is no longer available.");
        return fresh;
      }, async () => {
        const reason = Number(review.values.reason);
        if (reason !== 0 && reason !== 1 && reason !== 2 && reason !== 3 && reason !== 4 && reason !== 5 && reason !== 6) throw new Error("The reason is invalid.");
        const result = await create({ ...audit, domainEntitiesStockAdjustmentsCreateStockDiscrepancy: { shelfMaterialBatchId: review.shelf.id, physicalQuantity: review.values.count, reasonCode: reason, notes: review.values.notes } });
        if ("error" in result) throw new Error(apiErrorMessage(result.error));
        void navigate(stockDiscrepancyPath(result.data));
      })} /> : null}
  </form>;
}
export function CreateStockDiscrepancyPage() {
  const query = materialsApi.useGetApiV1MaterialShelfQuery(audit);
  const parsed = useMemo(() => shelfSchema.array().safeParse(query.data), [query.data]);
  return <article className="min-w-0 space-y-4"><PageHeader title="Record stock discrepancy" crumbs={[{ label: "Stock discrepancies", to: "/warehouse/stock-discrepancies" }, { label: "New report" }]} />
    <RecordState loading={query.isLoading} data={parsed.success ? parsed.data : null} error={query.error ? apiErrorMessage(query.error) : null} retry={() => void query.refetch()}>{(shelves) => <CountForm shelves={shelves} />}</RecordState>
  </article>;
}
