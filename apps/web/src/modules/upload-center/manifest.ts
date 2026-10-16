import type { ModuleManifest } from "../contract";

// Bulk uploads from spreadsheets: material and product stock, attendance and shift assignments.
export const manifest = {
  id: "upload-center", label: "Upload Center", root: "/settings/upload-center", order: 97,
  access: { kind: "some", permissions: ["CanCreateMaterialStockAdjustment", "CanApproveFgtn", "CanSubmitAttendanceReportUpload", "CanSubmitShiftScheduleReportUpload"] },
} satisfies ModuleManifest<"upload-center", "/settings/upload-center">;
