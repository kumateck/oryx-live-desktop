import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatMonthYear } from "@/shared/format/dates";
import { countText } from "@/shared/packing/fg-quantity";
import { packsFrom, shipperSplit } from "@/shared/packing/packs";
import { useLazyGetApiV1ProductionScheduleApprovedProductsProductByProductIdQuery, usePostApiV1ProductionOrdersAllocateMutation } from "../api/order-api";
import { audit, packingProblems, startingPacks, type BatchPick } from "../lib/orders";
import { batchesSchema, type ApprovedBatch, type ProductionOrder } from "../schemas/order-schema";

/**
 * Builds a packing list for an order: for each product still to be packed, the approved batches the packs come
 * from and how many from each. Nothing is taken from stock until the list is saved.
 */
/** Packs as the store counts them: "12 shippers · 40 loose". Without a shipper size everything is loose. */
const asCount = (packs: number, perShipper: number) => countText({ ...shipperSplit(packs, perShipper), units: 0 });

export function PackingListDialog({ order, onClose }: { order: ProductionOrder; onClose: () => void }) {
  const open = useMemo(() => order.lines.filter((line) => !line.complete && line.remaining > 0 && line.productId), [order.lines]);
  const [loadBatches, loading] = useLazyGetApiV1ProductionScheduleApprovedProductsProductByProductIdQuery();
  const [save, saving] = usePostApiV1ProductionOrdersAllocateMutation();
  const [lineKey, setLineKey] = useState("");
  const [offered, setOffered] = useState<ApprovedBatch[]>([]);
  // Every batch that has been put on the list, kept so its stock can be checked after another product is chosen.
  const [known, setKnown] = useState<Map<string, ApprovedBatch>>(new Map());
  const [picks, setPicks] = useState<BatchPick[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const line = open.find((item) => item.key === lineKey) ?? null;

  const chooseLine = async (key: string) => {
    setLineKey(key); setOffered([]); setProblems([]);
    const chosen = open.find((item) => item.key === key);
    if (!chosen?.productId) return;
    const result = await loadBatches({ ...audit, productId: chosen.productId });
    if (result.error) { setProblems([apiErrorMessage(result.error)]); return; }
    const parsed = batchesSchema.safeParse(result.data ?? null);
    // Only batches packed the way the order asks, with packs still free.
    setOffered(parsed.success ? parsed.data.filter((batch) => batch.free > 0 && (chosen.packingId ? batch.packingId === chosen.packingId : batch.perShipper === chosen.perShipper)) : []);
  };
  const addBatch = (noteId: string) => {
    const batch = offered.find((item) => item.noteId === noteId);
    if (!batch || !line) return;
    if (picks.some((pick) => pick.lineKey === line.key && pick.noteId === noteId)) { setProblems([`Batch ${batch.batchNumber ?? "–"} is already on the list for ${line.productName}.`]); return; }
    const packs = startingPacks(line, batch, picks);
    if (packs <= 0) { setProblems([`${line.productName} already has all the packs it needs on the list, or batch ${batch.batchNumber ?? "–"} has none left.`]); return; }
    setKnown((current) => new Map(current).set(noteId, batch));
    setPicks((current) => [...current, { key: `${line.key}|${noteId}`, lineKey: line.key, noteId, ...shipperSplit(packs, batch.perShipper), packs }]);
    setProblems([]);
  };
  const total = picks.reduce((sum, pick) => sum + (Number.isFinite(pick.packs) ? pick.packs : 0), 0);
  const submit = async () => {
    const found = packingProblems(picks, open, known);
    setProblems(found);
    if (found.length > 0) return;
    const result = await save({ ...audit, domainEntitiesProductionOrdersAllocateProductionOrderRequest: { productionOrderId: order.id,
      // One entry per product and packing style, carrying every batch it is packed from.
      products: open.flatMap((item) => { const mine = picks.filter((pick) => pick.lineKey === item.key);
        return mine.length > 0 && item.productId && item.packingId ? [{ productId: item.productId, productPackingId: item.packingId, fulfilledQuantities: mine.map((pick) => ({ finishedGoodsTransferNoteId: pick.noteId, quantity: pick.packs })) }] : []; }) } });
    if ("error" in result) { setProblems([apiErrorMessage(result.error)]); return; }
    toast.success("Packing list created", { description: `${total.toLocaleString()} packs for ${order.code}.` });
    onClose();
  };
  const busy = saving.isLoading;
  return <Dialog open onOpenChange={(next) => { if (!next && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-5xl">
      <DialogHeader><DialogTitle>Generate packing list · {order.code}</DialogTitle><DialogDescription>{order.customer.name}. Choose a product, then the approved batches its packs come from.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-4">
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><caption className="sr-only">Still to pack</caption>
          <thead><tr className="border-b text-left text-xs text-muted-foreground"><th scope="col" className="py-1.5 font-medium">Product</th><th scope="col" className="py-1.5 font-medium">Packing</th><th scope="col" className="py-1.5 text-right font-medium">Ordered</th><th scope="col" className="py-1.5 text-right font-medium">Packed</th><th scope="col" className="py-1.5 text-right font-medium">Still to pack</th><th scope="col" className="py-1.5 text-right font-medium">On this list</th></tr></thead>
          <tbody>{open.length === 0 ? <tr><td colSpan={6} className="py-3 text-center text-muted-foreground">Every product on this order is packed.</td></tr> : open.map((item) => { const listed = picks.filter((pick) => pick.lineKey === item.key).reduce((sum, pick) => sum + pick.packs, 0);
            return <tr key={item.key} className="border-b last:border-0"><td className="py-1.5 break-words">{item.productName}</td><td className="py-1.5">{item.packing ?? "–"}</td><td className="py-1.5 text-right">{asCount(item.ordered, item.perShipper)}</td>
              <td className="py-1.5 text-right">{asCount(item.fulfilled, item.perShipper)}</td><td className="py-1.5 text-right font-medium">{asCount(item.remaining, item.perShipper)}</td><td className={listed > item.remaining ? "py-1.5 text-right font-medium text-destructive" : "py-1.5 text-right"}>{asCount(listed, item.perShipper)}</td></tr>; })}</tbody></table></div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="packing-product">Product</Label>
            <Select value={lineKey} onValueChange={(value) => void chooseLine(value)} disabled={busy || open.length === 0}><SelectTrigger id="packing-product" className="w-full"><SelectValue placeholder="Select a product" /></SelectTrigger>
              <SelectContent>{open.map((item) => <SelectItem key={item.key} value={item.key}>{item.productName}{item.packing ? ` (${item.packing})` : ""}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label htmlFor="packing-batch">Approved batch</Label>
            <Select value="" onValueChange={addBatch} disabled={busy || !line || loading.isFetching || offered.length === 0}><SelectTrigger id="packing-batch" className="w-full"><SelectValue placeholder={!line ? "Choose the product first" : loading.isFetching ? "Loading batches…" : offered.length ? "Add a batch" : "No approved batch has packs free"} /></SelectTrigger>
              <SelectContent>{offered.map((batch) => <SelectItem key={batch.noteId} value={batch.noteId}>{batch.batchNumber ?? "No batch number"} · {asCount(batch.free, batch.perShipper)} free · expires {formatMonthYear(batch.expires) ?? "–"}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><caption className="sr-only">Packing list</caption>
          <thead><tr className="border-b text-left text-xs text-muted-foreground"><th scope="col" className="py-1.5 font-medium">#</th><th scope="col" className="py-1.5 font-medium">Product</th><th scope="col" className="py-1.5 font-medium">Batch</th><th scope="col" className="py-1.5 font-medium">Made</th><th scope="col" className="py-1.5 font-medium">Expires</th>
            <th scope="col" className="py-1.5 text-right font-medium">Free in batch</th><th scope="col" className="py-1.5 text-right font-medium">Per shipper</th><th scope="col" className="py-1.5 pl-3 font-medium">Shippers</th><th scope="col" className="py-1.5 pl-3 font-medium">Loose</th><th scope="col" className="py-1.5 text-right font-medium">Packs</th><th scope="col" className="py-1.5"><span className="sr-only">Remove</span></th></tr></thead>
          <tbody>{picks.length === 0 ? <tr><td colSpan={11} className="py-4 text-center text-muted-foreground">No batches added yet.</td></tr> : picks.map((pick, index) => { const batch = known.get(pick.noteId); const item = open.find((entry) => entry.key === pick.lineKey);
            const label = `batch ${batch?.batchNumber ?? index + 1} for ${item?.productName ?? "product"}`;
            const field = (name: "shippers" | "loose") => <Input type="number" min={0} step={1} inputMode="numeric" className="h-8 w-24" aria-label={`${name === "shippers" ? "Shippers" : "Loose packs"} from ${label}`} disabled={busy}
              value={Number.isFinite(pick[name]) ? pick[name] : ""} onChange={(event) => { const value = event.target.value === "" ? Number.NaN : Number(event.target.value);
                setPicks((current) => current.map((entry) => { if (entry.key !== pick.key) return entry; const next = { ...entry, [name]: value }; return { ...next, packs: packsFrom(next.shippers, next.loose, batch?.perShipper) }; })); setProblems([]); }} />;
            return <tr key={pick.key} className="border-b last:border-0"><td className="py-1.5">{index + 1}</td><td className="py-1.5 break-words">{item?.productName ?? "–"}</td><td className="py-1.5">{batch?.batchNumber ?? "–"}</td><td className="py-1.5">{formatMonthYear(batch?.made) ?? "–"}</td><td className="py-1.5">{formatMonthYear(batch?.expires) ?? "–"}</td>
              <td className="py-1.5 text-right">{batch ? asCount(batch.free, batch.perShipper) : "–"}</td><td className="py-1.5 text-right">{batch?.perShipper || "–"}</td>
              <td className="py-1.5 pl-3">{field("shippers")}</td><td className="py-1.5 pl-3">{field("loose")}</td><td className="py-1.5 text-right font-medium">{pick.packs.toLocaleString()}</td>
              <td className="py-1.5 text-right"><Button type="button" size="icon-sm" variant="ghost" className="text-destructive" aria-label={`Remove batch ${batch?.batchNumber ?? index + 1}`} disabled={busy} onClick={() => setPicks((current) => current.filter((entry) => entry.key !== pick.key))}><Trash2 /></Button></td></tr>; })}</tbody></table></div>
        <p role="status" className="text-sm">Total on this list <span className="font-semibold">{total.toLocaleString()} packs</span></p>
        {problems.length > 0 ? <ul role="alert" className="list-disc space-y-0.5 pl-5 text-sm text-destructive">{problems.map((problem) => <li key={problem}>{problem}</li>)}</ul> : null}
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="button" disabled={busy || picks.length === 0} onClick={() => void submit()}>{busy ? <><Spinner />Saving…</> : "Create packing list"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
