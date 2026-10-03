import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime, formatMonthYear } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { formatQuantityNumber } from "@/shared/units/quantity";
import {
  useGetApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductIdQuery, useGetApiV1ProductionScheduleFinishedGoodsTransferNoteBmrByBatchManufacturingRecordIdQuery,
  useGetApiV1ProductionScheduleManufacturingProductByProductionScheduleProductIdQuery, usePostApiV1ProductionScheduleFinishedGoodsTransferNoteMutation,
} from "../../api/activity-api";
import { shipperBreakdown, transferProblem, transferRequest, transferTotals } from "../../lib/finished-goods";
import { finalPackingTotalsSchema, transferBatchRecordSchema, transferFormSchema, transferNotesSchema, type TransferFormValues, type TransferNote } from "../../schemas/finished-goods-schema";

const audit = { module: "Production", subModule: "Goods Received Notes" } as const;
const column = dataTableColumns<TransferNote>();
const count = (value: number) => formatQuantityNumber(value, "calculated");
const missing = (error: object | undefined) => Boolean(error && "status" in error && error.status === 404);
const fields = [{ type: InputTypes.NUMBER, name: "quantity", label: "Quantity to transfer", required: true, min: 0 }] as const satisfies readonly WizardField<TransferFormValues>[];

function Figure({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-md border p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-lg font-semibold">{value}</dd></div>;
}

/** Sends packed finished goods from production to the finished goods store, all at once or in parts. */
export function FinishedGoodsDialog({ batchId, stepId, productName, onClose }: { batchId: string; stepId: string; productName: string; onClose: () => void }) {
  const arg = { ...audit, productionScheduleProductId: batchId };
  const recordQuery = useGetApiV1ProductionScheduleManufacturingProductByProductionScheduleProductIdQuery(arg);
  const packingQuery = useGetApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductIdQuery(arg);
  const record = useMemo(() => { const parsed = transferBatchRecordSchema.safeParse(recordQuery.data ?? null); return parsed.success ? parsed.data : null; }, [recordQuery.data]);
  const notesQuery = useGetApiV1ProductionScheduleFinishedGoodsTransferNoteBmrByBatchManufacturingRecordIdQuery({ ...audit, batchManufacturingRecordId: record?.id ?? "" }, { skip: !record });
  const [create, mutation] = usePostApiV1ProductionScheduleFinishedGoodsTransferNoteMutation();
  const [message, setMessage] = useState("");

  const packing = useMemo(() => { const parsed = finalPackingTotalsSchema.safeParse(missing(packingQuery.error) ? null : packingQuery.data ?? null); return parsed.success ? parsed.data : null; }, [packingQuery.data, packingQuery.error]);
  const notes = useMemo(() => { const parsed = transferNotesSchema.safeParse(missing(notesQuery.error) ? null : notesQuery.data ?? null); return parsed.success ? parsed.data : []; }, [notesQuery.data, notesQuery.error]);
  const totals = useMemo(() => transferTotals(packing?.packed ?? 0, notes), [packing, notes]);
  const loading = recordQuery.isLoading || packingQuery.isLoading || notesQuery.isLoading;
  const failure = (missing(recordQuery.error) ? undefined : recordQuery.error) ?? (missing(packingQuery.error) ? undefined : packingQuery.error) ?? (missing(notesQuery.error) ? undefined : notesQuery.error);
  const problem = loading || failure ? null : transferProblem({ record, packed: packing ? packing.packed : null, remaining: totals.remaining });

  const form = useForm<TransferFormValues>({ resolver: zodResolver(transferFormSchema) });
  const quantity = useWatch({ control: form.control, name: "quantity" });
  const unit = record?.packing?.unit?.name ?? "";
  const breakdown = shipperBreakdown(typeof quantity === "number" && quantity > 0 ? quantity : totals.remaining, record?.packing?.packsPerShipper ?? null);
  const columns = useMemo(() => column.columns([
    column.accessor((note) => note.number ?? "–", { id: "number", header: "Note" }),
    column.accessor((note) => formatDateTime(note.createdAt) ?? "–", { id: "when", header: "Raised", size: 190 }),
    column.accessor((note) => count(note.quantity), { id: "quantity", header: "Quantity", size: 120 }),
    column.accessor("state", { header: "Status", size: 190 }),
  ]), []);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    if (values.quantity > totals.remaining) { form.setError("quantity", { message: `Only ${count(totals.remaining)} ${unit} are left to transfer` }); return; }
    const body = record && packing ? transferRequest({ quantity: values.quantity, record, stepId, totals, yieldPacked: packing.yieldPacked }) : null;
    if (!body) return;
    const result = await create({ ...audit, domainEntitiesMaterialsBatchCreateFinishedGoodsTransferNoteRequest: body });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(`${count(values.quantity)} ${unit} sent to the finished goods store`);
    onClose();
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !mutation.isLoading) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Transfer finished goods</DialogTitle>
        <DialogDescription>{productName}{record?.batchNumber ? `, batch ${record.batchNumber}` : ""}. The finished goods store confirms what it receives.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          {loading ? <Skeleton className="h-40 w-full" /> : failure ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(failure)}</p> : <>
            <dl className="grid gap-3 sm:grid-cols-3"><Figure label="Packed" value={`${count(totals.packed)} ${unit}`} /><Figure label="Already transferred" value={`${count(totals.transferred)} ${unit}`} />
              <Figure label="Left to transfer" value={`${count(totals.remaining)} ${unit}`} /></dl>
            {problem ? <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">{problem}</p> : <>
              <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
              <p className="text-xs text-muted-foreground">
                {totals.transferred === 0 ? `Enter ${count(totals.packed)} to send everything, or less to send part now and the rest later. ` : "This adds to what was sent before. "}
                {breakdown ? `That is ${breakdown.shippers} full ${breakdown.shippers === 1 ? "shipper" : "shippers"}${breakdown.loose ? ` and ${count(breakdown.loose)} loose` : ""} (${record?.packing?.packsPerShipper} per shipper).` : ""}</p>
            </>}
            <dl className="grid gap-x-8 gap-y-2 rounded-md bg-muted/50 p-3 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-muted-foreground">Packing style</dt><dd className="font-medium">{record?.packing?.name ?? "–"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Manufactured</dt><dd className="font-medium">{formatMonthYear(record?.manufacturingDate) ?? "–"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Expires</dt><dd className="font-medium">{formatMonthYear(record?.expiryDate) ?? "–"}</dd></div>
            </dl>
            {notes.length ? <section className="space-y-2"><h3 className="text-sm font-semibold">Earlier transfers</h3>
              <ListDataTable label="Earlier transfers" columns={columns} rows={notes} getRowId={(note) => note.id} /></section> : null}
          </>}
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={mutation.isLoading} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading || Boolean(failure) || Boolean(problem) || mutation.isLoading}>{mutation.isLoading ? <><Spinner />Sending…</> : "Transfer"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
