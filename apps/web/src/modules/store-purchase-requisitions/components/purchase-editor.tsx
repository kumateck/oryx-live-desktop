import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { ItemLinesEditor, itemLineProblems, newItemLine, type ItemLine } from "@/shared/inventory/item-lines";
import { stores, type Store } from "@/shared/inventory/stores";
import { useItemChoices } from "@/shared/inventory/use-item-choices";
import { workflowRule } from "@/shared/inventory/workflows";
import { purchaseEditable, purchaseRequisitionAudit, purchaseRequisitionCodeModel, purchaseRequisitionSchema, type PurchaseRequisition } from "../lib/purchase-requisitions";

const today = () => new Date().toISOString().slice(0, 10);

/** Raises or edits a store purchase requisition. Edits re-read it first and stop once any item has been sourced. */
export function PurchaseRequisitionEditor({ store, requisition, onClose, onSaved }: {
  store: Store; requisition: PurchaseRequisition | null; onClose: () => void; onSaved: (id: string) => void;
}) {
  const permission = usePermissionAction(workflowRule(store, "purchaseRequisitions", requisition ? "edit" : "create"));
  const items = useItemChoices(store, purchaseRequisitionAudit);
  const code = useGeneratedCode(purchaseRequisitionCodeModel);
  const [reread] = inventoryApi.useLazyGetApiV1ProcurementInventoryByIdQuery();
  const [create, creating] = inventoryApi.usePostApiV1ProcurementInventoryMutation();
  const [update, updating] = inventoryApi.usePutApiV1ProcurementInventoryByIdMutation();
  const [number, setNumber] = useState(requisition?.code ?? "");
  const [delivery, setDelivery] = useState(requisition?.expectedDelivery?.slice(0, 10) ?? "");
  const [remarks, setRemarks] = useState(requisition?.remarks ?? "");
  const [lines, setLines] = useState<ItemLine[]>(() => requisition ? requisition.lines.map((line) => {
    const choice = { id: line.itemId, name: line.name, code: line.code, classification: line.classification as 0 | 1, available: line.available, unitId: line.unitId, unitName: line.unitName, unitSymbol: line.unit || null };
    items.remember(choice);
    return newItemLine(choice, String(line.quantity));
  }) : [newItemLine()]);
  const [problems, setProblems] = useState<Map<string, string>>(new Map());
  const [message, setMessage] = useState("");
  const [tried, setTried] = useState(false);
  const saving = creating.isLoading || updating.isLoading;
  const suggested = useRef(false);
  useEffect(() => {
    if (requisition || !code.ready || suggested.current) return;
    suggested.current = true;
    void code.suggest().then((next) => { if (next) setNumber((current) => current || next); });
  }, [code, requisition]);
  const numberProblem = !number.trim() ? "Enter the requisition number." : null;
  const deliveryProblem = delivery && !requisition && delivery < today() ? "The delivery date cannot be in the past." : null;

  const save = async () => {
    setMessage(""); setTried(true);
    const found = itemLineProblems(lines, { fractions: true });
    for (const line of lines) if (line.item && !line.item.unitId) found.set(line.key, "This item has no unit of measure, so it cannot be ordered.");
    setProblems(found);
    if (found.size > 0 || numberProblem || deliveryProblem) return;
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    if (requisition) {
      const fresh = await reread({ ...purchaseRequisitionAudit, id: requisition.id }, false);
      if (fresh.error) { setMessage(apiErrorMessage(fresh.error)); return; }
      const current = purchaseRequisitionSchema.safeParse(fresh.data);
      if (!current.success || !purchaseEditable(current.data)) { setMessage("Items on this requisition have been sourced, so it can no longer be changed."); return; }
    }
    const body = {
      code: number.trim(), expectedDeliveryDate: delivery ? new Date(`${delivery}T00:00:00Z`).toISOString() : null, remarks: remarks.trim() || null,
      items: lines.flatMap((line) => line.item ? [{ itemId: line.item.id, uoMId: line.item.unitId, quantity: Number(line.quantity) }] : []),
    };
    const result = requisition
      ? await update({ ...purchaseRequisitionAudit, id: requisition.id, domainEntitiesItemsRequisitionsCreateInventoryPurchaseRequisition: body })
      : await create({ ...purchaseRequisitionAudit, domainEntitiesItemsRequisitionsCreateInventoryPurchaseRequisition: body });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(requisition ? "Purchase requisition updated" : "Purchase requisition raised", { description: requisition ? undefined : "Procurement can now source it." });
    onSaved(requisition?.id ?? (typeof result.data === "string" ? result.data : ""));
  };

  const storeName = (stores[store] ?? "store").toLowerCase();
  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader><DialogTitle>{requisition ? `Edit ${requisition.code}` : `Raise a ${storeName} purchase requisition`}</DialogTitle>
        <DialogDescription>Items the {storeName} needs bought. Every item must be from this store.</DialogDescription></DialogHeader>
      <form noValidate className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void save(); }}>
        <DialogBody className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="purchase-number">Requisition number <span className="text-destructive">*</span></Label>
              <Input id="purchase-number" value={number} disabled={Boolean(requisition)} onChange={(event) => setNumber(event.target.value)} aria-invalid={tried && numberProblem ? true : undefined} />
              {!requisition ? <p className="text-xs text-muted-foreground">{code.unavailable ? "No numbering rule is set up; enter the number yourself." : "Suggested from the next in the series. You can change it."}</p> : null}
              {tried && numberProblem ? <p role="alert" className="text-xs text-destructive">{numberProblem}</p> : null}</div>
            <div className="space-y-1.5"><Label htmlFor="purchase-delivery">Expected delivery</Label>
              <Input id="purchase-delivery" type="date" min={requisition ? undefined : today()} value={delivery} onChange={(event) => setDelivery(event.target.value)} aria-invalid={deliveryProblem ? true : undefined} />
              {deliveryProblem ? <p role="alert" className="text-xs text-destructive">{deliveryProblem}</p> : null}</div>
            <div className="space-y-1.5 md:col-span-2"><Label htmlFor="purchase-remarks">Remarks</Label>
              <Textarea id="purchase-remarks" rows={3} value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Anything Procurement should know" /></div>
          </div>
          <ItemLinesEditor lines={lines} onChange={(next) => { setLines(next); setProblems(new Map()); }} loadItems={items.loadOptions} label={items.label} lookup={(id) => items.lookup(id)} problems={problems} />
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : requisition ? "Save requisition" : "Raise requisition"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
