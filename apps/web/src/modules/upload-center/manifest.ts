import type { ModuleManifest } from "../contract";

// Bulk uploads from spreadsheets: material and product stock, opening-stock migration, attendance and shift assignments.
export const manifest = {
  id: "upload-center", label: "Upload Center", root: "/settings/upload-center", order: 97,
  access: { kind: "some", permissions: ["CanViewOpeningBalances", "CanApproveFgtn", "CanSubmitAttendanceReportUpload", "CanSubmitShiftScheduleReportUpload"] },
  // Draft details require opening-balance access even when another upload tab is allowed.
  routes: [{ pattern: "/settings/upload-center/stock-migrations/:id", access: { kind: "all", permissions: ["CanViewOpeningBalances"] } }],
} satisfies ModuleManifest<"upload-center", "/settings/upload-center">;
