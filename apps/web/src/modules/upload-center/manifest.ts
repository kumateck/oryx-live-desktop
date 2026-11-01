import type { ModuleManifest } from "../contract";

// Bulk uploads from spreadsheets: material and product stock, opening-stock migration, attendance and shift assignments.
export const manifest = {
  id: "upload-center", label: "Upload Center", root: "/settings/upload-center", order: 97,
  access: { kind: "some", permissions: ["CanCreateMaterialStockAdjustment", "CanApproveFgtn", "CanSubmitAttendanceReportUpload", "CanSubmitShiftScheduleReportUpload"] },
  // Checking and approving a stock migration replaces stock, so it needs the stock key, not just any upload key.
  routes: [{ pattern: "/settings/upload-center/stock-migrations/:id", access: { kind: "all", permissions: ["CanCreateMaterialStockAdjustment"] } }],
} satisfies ModuleManifest<"upload-center", "/settings/upload-center">;
