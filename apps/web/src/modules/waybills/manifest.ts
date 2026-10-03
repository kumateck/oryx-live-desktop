import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "waybills",
  label: "Waybills",
  root: "/logistics/waybill",
  order: 54,
  access: { kind: "all", permissions: ["CanViewWaybill"] },
  routes: [{ pattern: "/logistics/waybill/create", access: { kind: "all", permissions: ["CanCreateWaybill"] } }],
} satisfies ModuleManifest<"waybills", "/logistics/waybill">;
