import { toast } from "sonner";
import type { PurchaseOrder, PurchaseOrderLine } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { ConfirmActionDialog } from "@/shared/actions";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { toLargestUnit } from "@/shared/units/quantity";
import { usePutApiV1ProcurementPurchaseOrderByPurchaseOrderIdReviseMutation } from "../api/order-api";
import { returnToSourcing, takeLineOff } from "../lib/line-moves";
import { audit, reviseOrderPermissions } from "../lib/purchase-order-access";

/**
 * Takes a line off a sent order and hands the material back to Procurement to choose suppliers again.
 * One request: the server puts the requisition line back among those waiting to be sourced, and it is
 * then sourced on the Purchase requisitions page like any other.
 */
export function ReturnLineDialog({ order, line, onClose }: { order: PurchaseOrder; line: PurchaseOrderLine; onClose: () => void }) {
  const [revise] = usePutApiV1ProcurementPurchaseOrderByPurchaseOrderIdReviseMutation();
  return <ConfirmActionDialog require={reviseOrderPermissions[order.supplier.type ?? 0]} title={`Return ${line.materialName} to sourcing?`}
    description={`${toLargestUnit(line.quantity, line.unit, "calculated")?.text ?? line.quantity} comes off ${order.code}. The material goes back to Purchase requisitions, where new suppliers are chosen for it. This cannot be undone here.`}
    confirmLabel="Return to sourcing" busyLabel="Returning…" onClose={onClose} onConfirm={async () => {
      const result = await revise({ ...audit, purchaseOrderId: order.id, body: takeLineOff(returnToSourcing, line) });
      if ("error" in result) return apiErrorMessage(result.error);
      toast.success("Line returned to sourcing", { description: `${line.materialName} is waiting under Purchase requisitions.` });
      return null;
    }} />;
}
