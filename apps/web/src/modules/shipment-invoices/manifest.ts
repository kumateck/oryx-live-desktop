import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "shipment-invoices",
  label: "Shipment invoices",
  root: "/logistics/shipment-invoices",
  order: 52,
  access: { kind: "all", permissions: ["CanViewShipmentInvoice"] },
  routes: [{ pattern: "/logistics/shipment-invoices/create", access: { kind: "all", permissions: ["CanCreateShipmentInvoice"] } }],
} satisfies ModuleManifest<"shipment-invoices", "/logistics/shipment-invoices">;
