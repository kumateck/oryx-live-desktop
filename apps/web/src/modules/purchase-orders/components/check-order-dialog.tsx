import { toast } from "sonner";
import type { PurchaseOrder } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SupplierType } from "@/shared/procurement/supplier-type";
import { usePutApiV1ProcurementPurchaseOrderCheckByPurchaseOrderIdMutation } from "../api/order-api";
import { audit, checkOrderPermissions } from "../lib/purchase-order-access";
import { ReviewOrderDialog } from "./review-order-dialog";

/** A finalised order to read through and mark as checked, which sends it to its approvers. */
export function CheckOrderDialog({ order, type, onClose }: { order: PurchaseOrder; type: SupplierType; onClose: () => void }) {
  const { has } = useAccess();
  const [check] = usePutApiV1ProcurementPurchaseOrderCheckByPurchaseOrderIdMutation();
  return <ReviewOrderDialog order={order} type={type} title="Check purchase order" description="Read the order against the proforma invoice. Marking it as checked sends it for approval."
    action={has(checkOrderPermissions[type]) ? { label: "Mark as checked", busyLabel: "Saving…" } : null} onClose={onClose} onAct={async () => {
      const result = await check({ ...audit, purchaseOrderId: order.id });
      if ("error" in result) return apiErrorMessage(result.error);
      toast.success("Order checked", { description: `${order.code} is waiting for approval.` });
      onClose();
      return null;
    }} />;
}
