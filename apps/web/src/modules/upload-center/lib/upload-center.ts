export const uploadCenterPath = "/settings/upload-center";
/**
 * The server checks no permission on the stock uploads, which set stock directly; they are gated on the closest keys that
 * change stock. Attendance and shift uploads have their own keys.
 */
export const uploadPermissions = {
  material: "CanCreateMaterialStockAdjustment",
  product: "CanApproveFgtn",
  attendance: "CanSubmitAttendanceReportUpload",
  schedule: "CanSubmitShiftScheduleReportUpload",
} as const;
