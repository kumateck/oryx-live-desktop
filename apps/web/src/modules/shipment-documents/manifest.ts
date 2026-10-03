import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "shipment-documents",
  label: "Shipment documents",
  root: "/logistics/shipment-documents",
  order: 53,
  access: { kind: "all", permissions: ["CanViewShipmentDocument"] },
  routes: [{ pattern: "/logistics/shipment-documents/create", access: { kind: "all", permissions: ["CanCreateShipmentDocument"] } }],
} satisfies ModuleManifest<"shipment-documents", "/logistics/shipment-documents">;
