import type { ModuleManifest } from "../contract";

// Each dashboard has its own view key, which the server checks too.
export const manifest = {
  id: "warehouse-dashboard",
  label: "Warehouse dashboard",
  root: "/warehouse-dashboard",
  order: 104,
  access: { kind: "all", permissions: ["CanViewWarehouseDashboard"] },
} satisfies ModuleManifest<"warehouse-dashboard", "/warehouse-dashboard">;
