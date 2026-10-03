import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { PurchaseOrderLines } from "@/modules/proforma-requests/components/purchase-order-lines";
import { PurchaseOrderPrint } from "@/modules/proforma-requests/components/purchase-order-print";
import type { PurchaseOrder } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { PrintButton } from "@/shared/print/print-button";
import { SupplierSummary } from "@/shared/procurement/supplier-summary";
import type { SupplierType } from "@/shared/procurement/supplier-type";
import { OrderTerms, OrderTotals } from "./order-terms";

/**
 * A finalised order laid out to be read before something is done with it. `action` is that something;
 * `onAct` returns why it failed, or null. `children` holds anything the action needs filled in first.
 */
export function ReviewOrderDialog({ order, type, title, description, action, block, children, onAct, onClose }: {
  order: PurchaseOrder; type: SupplierType; title: string; description: string; action: { label: string; busyLabel: string } | null; block?: string | null | undefined;
  children?: ReactNode; onAct?: () => Promise<string | null>; onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const act = async () => {
    if (!onAct) return;
    setBusy(true); setMessage("");
    try { const failure = await onAct(); if (failure) setMessage(failure); }
    finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader><DialogTitle>{title} · {order.code}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <DialogBody className="space-y-4">
        <SupplierSummary supplier={order.supplier} />
        <OrderTerms order={order} />
        <PurchaseOrderLines order={order} />
        <OrderTotals order={order} type={type} />
        {children}
        {block ? <p role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">{block}</p> : null}
        {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      </DialogBody>
      <DialogFooter>
        <PrintButton size="default" preview={(close) => <PurchaseOrderPrint order={order} title="Purchase order" type={type} onClose={close} />} />
        <Button type="button" variant="outline" disabled={busy} onClick={onClose}>{action ? "Cancel" : "Close"}</Button>
        {action ? <Button type="button" disabled={busy || Boolean(block)} onClick={() => void act()}>{busy ? <><Spinner />{action.busyLabel}</> : action.label}</Button> : null}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
