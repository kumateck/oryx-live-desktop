import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { comparisonSchema } from "@/modules/price-comparison/schemas/comparison-schema";
import type { PurchaseOrder, PurchaseOrderLine } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatMoney, formatUnitPrice, lineCost } from "@/shared/procurement/price";
import type { SupplierType } from "@/shared/procurement/supplier-type";
import { toLargestUnit } from "@/shared/units/quantity";
import { useGetApiV1RequisitionSourceMaterialPriceComparisonByMaterialQuery, useGetApiV1RequisitionSourceMaterialPriceComparisonQuery, usePostApiV1RequisitionSourceQuotationProcessPurchaseOrderMutation,
  usePutApiV1ProcurementPurchaseOrderByPurchaseOrderIdReviseMutation } from "../api/order-api";
import { awardLine, reassignBlock, reassignCandidates, reassignSupplier, takeLineOff } from "../lib/line-moves";
import { audit } from "../lib/purchase-order-access";

/**
 * Moves one line of a sent order to another supplier who quoted for it. Two steps, in order: the line comes
 * off this order, then the chosen supplier is awarded it, which creates their order.
 */
export function ReassignLineDialog({ order, line, type, onClose }: { order: PurchaseOrder; line: PurchaseOrderLine; type: SupplierType; onClose: () => void }) {
  const fresh = { refetchOnMountOrArgChange: true } as const;
  const quotes = useGetApiV1RequisitionSourceMaterialPriceComparisonByMaterialQuery({ ...audit, supplierType: type, purchaseOrderId: order.id, materialId: line.materialId ?? "" }, { ...fresh, skip: !line.materialId });
  const open = useGetApiV1RequisitionSourceMaterialPriceComparisonQuery({ ...audit, supplierType: type }, fresh);
  const [revise] = usePutApiV1ProcurementPurchaseOrderByPurchaseOrderIdReviseMutation();
  const [award] = usePostApiV1RequisitionSourceQuotationProcessPurchaseOrderMutation();
  const [chosen, setChosen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  // Once the line is off the order the first step must not be repeated; only the award is left to do.
  const [takenOff, setTakenOff] = useState(false);
  const candidates = useMemo(() => { const parsed = comparisonSchema.safeParse(quotes.data ?? null); return parsed.success ? reassignCandidates(parsed.data, line, order) : []; }, [quotes.data, line, order]);
  const openGroups = useMemo(() => { const parsed = comparisonSchema.safeParse(open.data ?? null); return parsed.success ? parsed.data : []; }, [open.data]);
  const loading = quotes.isLoading || open.isLoading;
  const failed = quotes.error ?? open.error;
  const block = loading || takenOff ? null : failed ? apiErrorMessage(failed) : reassignBlock(line, openGroups, candidates);
  const quote = candidates.find((item) => item.key === chosen) ?? null;

  const submit = async () => {
    if (!quote) return;
    setBusy(true); setMessage("");
    try {
      if (!takenOff) {
        const removed = await revise({ ...audit, purchaseOrderId: order.id, body: takeLineOff(reassignSupplier, line) });
        if ("error" in removed) { setMessage(apiErrorMessage(removed.error)); return; }
        setTakenOff(true);
      }
      const awarded = await award({ ...audit, supplierType: type, body: awardLine(line, quote) });
      if ("error" in awarded) {
        setMessage(`${line.materialName} is off this order, but ${quote.supplierName} could not be awarded it: ${apiErrorMessage(awarded.error)} Try again, or choose the supplier under Price comparison, where the material now waits.`);
        return;
      }
      toast.success("Line moved to another supplier", { description: `${quote.supplierName}'s order is waiting under Proforma requests.` });
      onClose();
    } finally { setBusy(false); }
  };

  return <Dialog open onOpenChange={(next) => { if (!next && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>Move {line.materialName} to another supplier</DialogTitle>
        <DialogDescription>{toLargestUnit(line.quantity, line.unit, "calculated")?.text ?? line.quantity} comes off {order.code} and a new order is created for the supplier you choose.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-3">
        {loading ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Looking for other quotes…</p> : null}
        {block ? <p role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">{block}</p> : null}
        {!loading && (takenOff || !block) ? <fieldset disabled={busy} className="space-y-2"><legend className="text-sm font-medium">Suppliers who quoted for it</legend>
          {candidates.map((item) => <label key={item.key} className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-[:checked]:border-primary">
            <input type="radio" name="supplier" className="mt-1 size-4 accent-primary" checked={chosen === item.key} onChange={() => setChosen(item.key)} />
            <span className="min-w-0 flex-1"><span className="block break-words font-medium">{item.supplierName}</span>
              <span className="block text-sm text-muted-foreground">{formatUnitPrice(item.price, item.currency, item.priceUnit)} · {formatMoney(lineCost({ quantity: line.quantity, unit: line.unit, price: item.price, priceUnit: item.priceUnit }), item.currency)} for the line</span></span>
          </label>)}</fieldset> : null}
        {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={onClose}>{takenOff ? "Close" : "Cancel"}</Button>
        <Button type="button" disabled={busy || loading || !quote || Boolean(block)} onClick={() => void submit()}>{busy ? <><Spinner />Moving…</> : takenOff ? "Award the supplier" : "Move the line"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
