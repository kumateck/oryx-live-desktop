import type { SupplierType } from "@/shared/procurement/supplier-type";

/** Goods from a foreign supplier travel on a shipment document; goods from a local one on a waybill. */
export type ShipmentKind = "shipment" | "waybill";

/** The stages a delivery passes through. The numbers are the server's. */
export const shipmentStatus = { new: 0, atPort: 1, cleared: 2, inTransit: 3, arrived: 4 } as const;
export type ShipmentStatus = 0 | 1 | 2 | 3 | 4;
export const shipmentStatusLabels: Record<ShipmentStatus, string> = { 0: "New", 1: "At port", 2: "Cleared", 3: "In transit", 4: "Arrived" };

interface KindConfig {
  title: string; singular: string; root: string; supplierType: SupplierType; codeModel: string; fileModel: string;
  /** The stages in the order they happen. A local delivery has no port and no clearing. */
  steps: readonly ShipmentStatus[];
  permissions: { view: string; create: string; advance: string };
  audit: { module: string; subModule: string };
}
export const shipmentKinds: Record<ShipmentKind, KindConfig> = {
  shipment: { title: "Shipment documents", singular: "shipment document", root: "/logistics/shipment-documents", supplierType: 0, codeModel: "ShipmentDocument", fileModel: "ShipmentDocument", steps: [0, 1, 2, 3, 4],
    permissions: { view: "CanViewShipmentDocument", create: "CanCreateShipmentDocument", advance: "CanChangeShipmentDocumentStatus" }, audit: { module: "Logistics", subModule: "Shipment Documents" } },
  waybill: { title: "Waybills", singular: "waybill", root: "/logistics/waybill", supplierType: 1, codeModel: "Waybill", fileModel: "ShipmentDocument", steps: [0, 3, 4],
    permissions: { view: "CanViewWaybill", create: "CanCreateWaybill", advance: "CanChangeWaybillStatus" }, audit: { module: "Logistics", subModule: "Waybill" } },
};
export const shipmentPath = (kind: ShipmentKind, id: string) => `${shipmentKinds[kind].root}/${id}/details`;
export const createShipmentPath = (kind: ShipmentKind) => `${shipmentKinds[kind].root}/create`;

/** The stage that follows the current one, or null at the end. */
export function nextStatus(kind: ShipmentKind, status: ShipmentStatus): ShipmentStatus | null {
  const steps = shipmentKinds[kind].steps;
  return steps[steps.indexOf(status) + 1] ?? null;
}

/**
 * Why a delivery cannot move to its next stage, or null when it can. A shipment leaves the port only
 * once its billing sheet is approved; the server also insists every charge on it is paid.
 */
export function advanceBlock(kind: ShipmentKind, shipment: { status: ShipmentStatus; hasBillingSheet: boolean; billingSheetApproved: boolean }): string | null {
  if (nextStatus(kind, shipment.status) === null) return "This delivery has arrived; there is no further stage.";
  if (kind === "shipment" && shipment.status === shipmentStatus.atPort) {
    if (!shipment.hasBillingSheet) return "Create the billing sheet for this shipment first.";
    if (!shipment.billingSheetApproved) return "The billing sheet has to be approved before the shipment is cleared.";
  }
  return null;
}

export const shipmentFileTypes = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xlsx";
export const shipmentFileLimit = 10 * 1024 * 1024;

/** What each stage means, as shown on the timeline. */
export const shipmentStageNotes: Record<ShipmentStatus, string> = { 0: "The document was created", 1: "The goods reached the port", 2: "Cleared through customs", 3: "On the way to the store", 4: "Delivered to the store" };
/** How far along its stages a delivery is, as a whole percentage. */
export function shipmentProgress(kind: ShipmentKind, status: ShipmentStatus): { done: number; of: number; percent: number } {
  const steps = shipmentKinds[kind].steps;
  const done = Math.max(0, steps.indexOf(status)) + 1;
  return { done, of: steps.length, percent: Math.round((done / steps.length) * 100) };
}
