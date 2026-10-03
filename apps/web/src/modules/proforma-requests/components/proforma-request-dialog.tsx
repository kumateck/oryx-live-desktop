import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { SupplierSummary } from "@/shared/procurement/supplier-summary";
import { PrintButton } from "@/shared/print/print-button";
import { usePostApiV1ProcurementPurchaseOrderProformaInvoiceByPurchaseOrderIdMutation } from "../api/purchase-order-api";
import { audit } from "../lib/proforma-request-access";
import type { PurchaseOrder } from "../schemas/purchase-order-schema";
import { PurchaseOrderLines } from "./purchase-order-lines";
import { PurchaseOrderPrint } from "./purchase-order-print";

/** Asks the awarded supplier for a proforma invoice. The server emails the order as a PDF; nothing is sent until the button is pressed. */
export function ProformaRequestDialog({ order, onClose }: { order: PurchaseOrder; onClose: () => void }) {
  const [send, mutation] = usePostApiV1ProcurementPurchaseOrderProformaInvoiceByPurchaseOrderIdMutation();
  const [message, setMessage] = useState("");
  const block = order.supplier.email ? null : "This supplier has no email address. Add one on the supplier's record, then send the request.";
  const submit = async () => {
    setMessage("");
    const result = await send({ ...audit, purchaseOrderId: order.id });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Proforma invoice requested", { description: `Emailed to ${order.supplier.email ?? order.supplier.name}.` });
    onClose();
  };
  const busy = mutation.isLoading;
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Request proforma invoice · {order.code}</DialogTitle>
        <DialogDescription>The supplier is sent this order and asked for their proforma invoice.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-4">
        <SupplierSummary supplier={order.supplier} />
        <PurchaseOrderLines order={order} />
        {block ? <p role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">{block}</p> : null}
        {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      </DialogBody>
      <DialogFooter>
        <PrintButton size="default" preview={(close) => <PurchaseOrderPrint order={order} title="Proforma invoice request" onClose={close} />} />
        <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button type="button" disabled={busy || block !== null} onClick={() => void submit()}>{busy ? <><Spinner />Sending…</> : "Send request by email"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
