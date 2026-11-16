import type { ModuleManifest } from "../contract";
// The old HR report pages only redirect into the reports hub. Any one people report key opens them; the hub then
// checks the chosen report's own key. These are the people reports' keys from the reports module.
export const manifest = { id: "hr-reports", label: "HR reports", root: "/hr/human-resources-report", order: 130,
  access: { kind: "some", permissions: ["CanViewEmployeeMasterListReport", "CanViewStaffGradeReport", "CanViewNewHiresAndExitsReport", "CanViewStaffTotalReport", "CanViewStaffGenderRatioReport", "CanViewStaffTurnoverReport", "CanViewLeaveOverviewReport", "CanViewDailyAttendanceReport", "CanViewDepartmentAttendanceReport"] },
} satisfies ModuleManifest<"hr-reports", "/hr/human-resources-report">;
