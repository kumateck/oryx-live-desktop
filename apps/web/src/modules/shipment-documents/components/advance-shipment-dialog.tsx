import { toast } from "sonner";
import { ConfirmActionDialog } from "@/shared/actions";
import { useInvoiceBillingSheet } from "@/modules/billing-sheets/hooks/use-billing-sheets";
import { chargeState } from "@/modules/billing-sheets/lib/billing-rules";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePutApiV1ProcurementShipmentsByShipmentIdStatusMutation } from "../api/shipment-api";
import { nextStatus, shipmentKinds, shipmentStatus, shipmentStatusLabels, type ShipmentKind } from "../lib/shipment-kinds";
import type { Shipment } from "../schemas/shipment-schema";

/** Moves a delivery to its next stage, after confirming. Stages are only ever taken one at a time, in order. */
export function AdvanceShipmentDialog({ kind, shipment, onClose }: { kind: ShipmentKind; shipment: Shipment; onClose: () => void }) {
  const [update] = usePutApiV1ProcurementShipmentsByShipmentIdStatusMutation();
  const next = nextStatus(kind, shipment.status);
  // A shipment leaves the port only when every charge on its billing sheet is paid; that is checked before asking the server.
  const atPort = kind === "shipment" && shipment.status === shipmentStatus.atPort && shipment.hasBillingSheet;
  const billing = useInvoiceBillingSheet(shipment.invoice?.id ?? null, atPort);
  if (next === null) return null;
  const arriving = next === shipmentStatus.arrived;
  return <ConfirmActionDialog require={shipmentKinds[kind].permissions.advance} destructive={false} title={`Mark ${shipment.code} as ${shipmentStatusLabels[next].toLowerCase()}?`}
    description={arriving ? "The departments that asked for these materials are told the delivery has arrived, and it goes for approval before the materials are distributed. This cannot be undone."
      : `The ${shipmentKinds[kind].singular} moves from ${shipmentStatusLabels[shipment.status].toLowerCase()} to ${shipmentStatusLabels[next].toLowerCase()}. This cannot be undone.`}
    confirmLabel={`Mark as ${shipmentStatusLabels[next].toLowerCase()}`} busyLabel="Saving…" onClose={onClose} onConfirm={async () => {
      if (atPort && billing.loading) return "The charges on the billing sheet are still being checked. Try again in a moment.";
      const unpaid = atPort ? billing.sheet?.charges.filter((charge) => chargeState(charge) !== "paid").length ?? 0 : 0;
      if (unpaid > 0) return `${unpaid === 1 ? "1 charge" : `${unpaid} charges`} on the billing sheet ${unpaid === 1 ? "is" : "are"} not paid yet. Pay every charge before the shipment is cleared.`;
      const result = await update({ ...shipmentKinds[kind].audit, shipmentId: shipment.id, domainEntitiesShipmentsRequestUpdateShipmentStatusRequest: { status: next } });
      if ("error" in result) return apiErrorMessage(result.error);
      toast.success(`${shipment.code} is ${shipmentStatusLabels[next].toLowerCase()}`);
      return null;
    }} />;
}
