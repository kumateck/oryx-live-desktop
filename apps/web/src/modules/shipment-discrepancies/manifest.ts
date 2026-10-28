import type { ModuleManifest } from "../contract";
export const manifest = { id: "shipment-discrepancies", label: "Shipment discrepancies", root: "/logistics/shipment-discrepancies", order: 78,
  access: { kind: "all", permissions: ["CanViewShipmentDiscrepancy"] },
  routes: [{ pattern: "/logistics/shipment-discrepancies/create", access: { kind: "all", permissions: ["CanRecordShipmentDiscrepancy", "CanViewShipmentDocument"] } }],
} satisfies ModuleManifest<"shipment-discrepancies", "/logistics/shipment-discrepancies">;
