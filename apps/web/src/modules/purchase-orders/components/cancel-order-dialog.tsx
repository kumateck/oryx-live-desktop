import { toast } from "sonner";
import type { PurchaseOrder } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { ConfirmActionDialog } from "@/shared/actions/confirm-action-dialog";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SupplierType } from "@/shared/procurement/supplier-type";
import { useDeleteApiV1ProcurementPurchaseOrderByPurchaseOrderIdCancelMutation } from "../api/order-api";
import { audit, cancelOrderPermissions, orderStatus } from "../lib/purchase-order-access";

/** What cancelling does and does not do, said before it is done: the server only marks the order cancelled. */
export function cancelOrderDescription(order: PurchaseOrder): string {
  const sent = order.status === orderStatus.sent || order.status === orderStatus.revised;
  return [
    `${order.code} will be marked cancelled and can no longer be checked, approved, sent or invoiced.`,
    sent ? `It has already gone to ${order.supplier.name}; tell them it is cancelled.` : null,
    `Its ${order.items.length === 1 ? "line stays" : `${order.items.length} lines stay`} with the order and ${order.items.length === 1 ? "is" : "are"} not returned for sourcing.`,
    "This cannot be undone.",
  ].filter(Boolean).join(" ");
}

export function CancelOrderDialog({ order, type, onClose }: { order: PurchaseOrder; type: SupplierType; onClose: () => void }) {
  const [cancel] = useDeleteApiV1ProcurementPurchaseOrderByPurchaseOrderIdCancelMutation();
  return <ConfirmActionDialog title={`Cancel ${order.code}?`} description={cancelOrderDescription(order)} confirmLabel="Cancel order" busyLabel="Cancelling…"
    require={cancelOrderPermissions[type]} onClose={onClose} onConfirm={async () => {
      const result = await cancel({ ...audit, purchaseOrderId: order.id });
      if ("error" in result) return apiErrorMessage(result.error);
      toast.success("Purchase order cancelled", { description: order.code });
      return null;
    }} />;
}
