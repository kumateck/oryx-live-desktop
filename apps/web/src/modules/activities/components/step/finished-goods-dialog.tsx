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
import { countText, emptyCount, fgCount, fgText } from "@/shared/packing/fg-quantity";
import {
  useGetApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductIdQuery, useGetApiV1ProductionScheduleFinishedGoodsTransferNoteBmrByBatchManufacturingRecordIdQuery,
  useGetApiV1ProductionScheduleManufacturingProductByProductionScheduleProductIdQuery, usePostApiV1ProductionScheduleFinishedGoodsTransferNoteMutation,
} from "../../api/activity-api";
import { transferProblem, transferRequest, transferTotals, transferYield } from "../../lib/finished-goods";
import { finalPackingTotalsSchema, transferBatchRecordSchema, transferFormSchema, transferNotesSchema, type TransferFormValues, type TransferNote } from "../../schemas/finished-goods-schema";

const audit = { module: "Production", subModule: "Goods Received Notes" } as const;
const column = dataTableColumns<TransferNote>();
const missing = (error: object | undefined) => Boolean(error && "status" in error && error.status === 404);
const fields = [{ type: InputTypes.NUMBER, name: "shippers", label: "Shippers to transfer", min: 0, step: 1 }, { type: InputTypes.NUMBER, name: "loose", label: "Loose packs to transfer", min: 0, step: 1 }] as const satisfies readonly WizardField<TransferFormValues>[];

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

  // Quantities are held as yield; production counts and sends shippers and loose packs.
  const layout = record?.packing?.layout ?? null;
  const show = (value: number) => layout ? fgText(value, layout) : "–";
  const left = layout ? fgCount(totals.remaining, layout) ?? emptyCount() : emptyCount();
  const form = useForm<TransferFormValues>({ resolver: zodResolver(transferFormSchema), values: { shippers: left.shippers, loose: left.loose } });
  const [shippers, loose] = useWatch({ control: form.control, name: ["shippers", "loose"] });
  const entered = layout ? transferYield(shippers, loose, totals.remaining, layout) : null;
  const columns = useMemo(() => column.columns([
    column.accessor((note) => note.number ?? "–", { id: "number", header: "Note" }),
    column.accessor((note) => formatDateTime(note.createdAt) ?? "–", { id: "when", header: "Raised", size: 190 }),
    column.accessor((note) => layout ? fgText(note.quantity, layout) : "–", { id: "quantity", header: "Quantity", size: 220 }),
    column.accessor("state", { header: "Status", size: 190 }),
  ]), [layout]);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    if (!layout || !record) return;
    const quantity = transferYield(values.shippers, values.loose, totals.remaining, layout);
    if (quantity === null || quantity <= 0) { form.setError("shippers", { message: "Enter what to transfer" }); return; }
    if (quantity > totals.remaining) { form.setError("shippers", { message: `Only ${countText(left, layout.baseName)} is left to transfer` }); return; }
    const body = transferRequest({ quantity, record, stepId, totals });
    if (!body) return;
    const result = await create({ ...audit, domainEntitiesMaterialsBatchCreateFinishedGoodsTransferNoteRequest: body });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(`${fgText(quantity, layout)} sent to the finished goods store`);
    onClose();
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !mutation.isLoading) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Transfer finished goods</DialogTitle>
        <DialogDescription>{productName}{record?.batchNumber ? `, batch ${record.batchNumber}` : ""}. The finished goods store confirms what it receives.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          {loading ? <Skeleton className="h-40 w-full" /> : failure ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(failure)}</p> : <>
            <dl className="grid gap-3 sm:grid-cols-3"><Figure label="Packed" value={show(totals.packed)} /><Figure label="Already transferred" value={show(totals.transferred)} />
              <Figure label="Left to transfer" value={show(totals.remaining)} /></dl>
            {problem ? <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">{problem}</p> : <>
              <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
              <p className="text-xs text-muted-foreground">
                {totals.transferred === 0 ? "Everything packed is filled in. Lower it to send part now and the rest later. " : "This adds to what was sent before. "}
                {record?.packing?.packsPerShipper ? `${record.packing.packsPerShipper.toLocaleString()} packs per shipper.` : ""}
                {entered !== null && entered > 0 && entered < totals.remaining && layout ? ` ${show(totals.remaining - entered)} will be left.` : ""}</p>
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
