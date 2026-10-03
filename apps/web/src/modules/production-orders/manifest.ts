import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "production-orders",
  label: "Production orders",
  root: "/crm/production-order",
  order: 92,
  access: { kind: "all", permissions: ["CanViewOrder"] },
} satisfies ModuleManifest<"production-orders", "/crm/production-order">;
