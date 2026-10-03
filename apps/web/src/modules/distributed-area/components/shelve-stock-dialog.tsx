import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { emptyMove, MoveLine } from "@/modules/location-chart/components/move-stock-dialog";
import { useRacks } from "@/modules/location-chart/hooks/use-racks";
import { availableToMove, inSourceUnit, moveUnit } from "@/modules/location-chart/lib/move-stock";
import { moveStockFormSchema, type MoveStockFormValues } from "@/modules/location-chart/schemas/rack-schema";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { usePostApiV1MaterialDistributeMaterialMoveBatchMutation } from "../api/distributed-api";
import { audit } from "../lib/distributed-access";
import { shelvingProblems, shelvingRequest } from "../lib/shelving";
import type { DistributedStock } from "../schemas/distributed-schema";

export interface StockToPlace { materialName: string; batchNumber: string | null; quantity: number; unit: string | null; unitId: string | null }
export interface ShelfPlacement { warehouseLocationShelfId: string; quantity: number; uomId: string | null; note: string }

/**
 * Places a quantity of one batch on one or more shelves of the department's store, all of it at once.
 * `onPlace` sends it and returns why it failed, or null. Stock arriving by delivery and by transfer both use this.
 */
export function PlaceStockDialog({ stock, kind, title, description, onPlace, onClose }: { stock: StockToPlace; kind: MaterialKind; title: string; description: string; onPlace: (shelves: ShelfPlacement[]) => Promise<string | null>; onClose: () => void }) {
  const racks = useRacks(kind);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const unit = moveUnit(stock);
  const all = availableToMove(stock);
  // One shelf for everything is the common case, so the whole quantity is offered on the first line.
  const form = useForm<MoveStockFormValues>({ resolver: zodResolver(moveStockFormSchema), defaultValues: { moves: [{ ...emptyMove, quantity: all }] } });
  const lines = useFieldArray({ control: form.control, name: "moves" });
  // Read here so the dialog re-renders, and its lines show their messages, when validation fails.
  const listError = form.formState.errors.moves?.root?.message ?? form.formState.errors.moves?.message;

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const problems = shelvingProblems(stock, values.moves);
    for (const problem of problems) if (problem.index !== null) form.setError(`moves.${problem.index}.shelf`, { message: problem.message });
    const general = problems.find((problem) => problem.index === null);
    if (general) setMessage(general.message);
    if (problems.length > 0) return;
    setBusy(true);
    try {
      const failure = await onPlace(values.moves.flatMap((line) => line.shelf ? [{ warehouseLocationShelfId: line.shelf.value, quantity: inSourceUnit(line.quantity, stock), uomId: stock.unitId, note: line.note ?? "" }] : []));
      if (failure) { setMessage(failure); return; }
      toast.success("Stock put on shelves");
      onClose();
    } finally { setBusy(false); }
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <dl className="grid gap-x-8 gap-y-2 rounded-md bg-muted/50 p-3 text-sm sm:grid-cols-4">
            <div className="min-w-0 sm:col-span-2"><dt className="text-xs text-muted-foreground">Material</dt><dd className="break-words font-medium">{stock.materialName}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Batch</dt><dd className="font-medium">{stock.batchNumber ?? "–"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">To shelve</dt><dd className="font-medium">{formatQuantityNumber(all, "calculated")} {unit}</dd></div>
          </dl>
          {racks.error ? <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">{racks.error}<Button type="button" size="sm" variant="outline" onClick={racks.retry}>Retry</Button></p> : null}
          {!racks.loading && !racks.error && racks.racks.length === 0 ? <p role="alert" className="text-sm">Your department has no racks for this kind of material. Racks are set up under Settings.</p> : null}
          <ul className="space-y-2">{lines.fields.map((field, index) => <MoveLine key={field.id} form={form} index={index} racks={racks.racks} unit={unit}
            onRemove={lines.fields.length > 1 ? () => lines.remove(index) : null} />)}</ul>
          <Button type="button" size="sm" variant="outline" onClick={() => lines.append(emptyMove)}><Plus />Add another shelf</Button>
          {message || listError ? <p role="alert" className="text-sm text-destructive">{message || listError}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || racks.loading}>{busy ? <><Spinner />Saving…</> : "Put on shelves"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

/** Puts a newly received batch on one or more shelves of the department's store. */
export function ShelveStockDialog({ stock, kind, onClose }: { stock: DistributedStock; kind: MaterialKind; onClose: () => void }) {
  const [shelve] = usePostApiV1MaterialDistributeMaterialMoveBatchMutation();
  return <PlaceStockDialog stock={stock} kind={kind} title="Put received stock on shelves" description="Place the whole quantity, on one shelf or split over several." onClose={onClose} onPlace={async (shelves) => {
    const result = await shelve({ ...audit, domainEntitiesMaterialsBatchSupplyMaterialBatchFromHMaterialDistribute: { ...shelvingRequest(stock, []), shelfMaterialBatches: shelves } });
    return "error" in result ? apiErrorMessage(result.error) : null;
  }} />;
}
