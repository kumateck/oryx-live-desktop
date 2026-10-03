import type { ModuleManifest } from "../contract";

// The permissions are the ones the sidebar shows this dashboard for.
export const manifest = {
  id: "qa-qc-dashboard",
  label: "QA and QC dashboards",
  root: "/qa-qc-dashboard",
  order: 103,
  access: { kind: "some", permissions: ["CanViewRawMaterialGoodsReceiptNotes", "CanViewPackagingMaterialGoodsReceiptNotes", "CanViewAnalyticalTestRequests"] },
  routes: [
    { pattern: "/qa-qc-dashboard/qc", access: { kind: "some", permissions: ["CanViewRawMaterialGoodsReceiptNotes", "CanViewPackagingMaterialGoodsReceiptNotes"] } },
    { pattern: "/qa-qc-dashboard/qa", access: { kind: "some", permissions: ["CanViewAnalyticalTestRequests"] } },
  ],
} satisfies ModuleManifest<"qa-qc-dashboard", "/qa-qc-dashboard">;
