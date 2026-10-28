import type { ModuleManifest } from "../contract";
export const manifest = { id: "stock-discrepancies", label: "Stock discrepancies", root: "/warehouse/stock-discrepancies", order: 77,
  access: { kind: "all", permissions: ["CanViewStockDiscrepancy"] },
  routes: [{ pattern: "/warehouse/stock-discrepancies/create", access: { kind: "all", permissions: ["CanRecordStockDiscrepancy"] } }],
} satisfies ModuleManifest<"stock-discrepancies", "/warehouse/stock-discrepancies">;
