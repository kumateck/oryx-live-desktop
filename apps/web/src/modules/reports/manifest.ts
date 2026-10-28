import type { ModuleManifest } from "../contract";
export const manifest = {
  id: "reports", label: "Reports", root: "/reports", order: 95,
  access: { kind: "some", permissions: ["CanViewWarehouseReport", "CanViewProcurementReport", "CanViewFgtnReport", "CanViewStoreAndInventoryReport", "CanViewHumanResourcesReport", "CanViewQcAndQaReport"] },
  routes: [
    { pattern: "/reports/warehouse-report", access: { kind: "all", permissions: ["CanViewWarehouseReport"] } },
    { pattern: "/reports/procurement-report", access: { kind: "all", permissions: ["CanViewProcurementReport"] } },
    { pattern: "/reports/procument-reports", access: { kind: "all", permissions: ["CanViewProcurementReport"] } },
    { pattern: "/reports/finish-goods-transfernote-report", access: { kind: "all", permissions: ["CanViewFgtnReport"] } },
    { pattern: "/reports/store-inventory-report", access: { kind: "all", permissions: ["CanViewStoreAndInventoryReport"] } },
    { pattern: "/reports/human-resources-report", access: { kind: "all", permissions: ["CanViewHumanResourcesReport"] } },
    { pattern: "/reports/human-resources-report/:report", access: { kind: "all", permissions: ["CanViewHumanResourcesReport"] } },
    { pattern: "/reports/qc-qa-reports", access: { kind: "all", permissions: ["CanViewQcAndQaReport"] } },
    { pattern: "/reports/qc-qa-reports/:report", access: { kind: "all", permissions: ["CanViewQcAndQaReport"] } },
  ],
} satisfies ModuleManifest<"reports", "/reports">;
