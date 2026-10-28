import type { ModuleManifest } from "../contract";
export const manifest = { id: "attendance", label: "Attendance summary", root: "/hr/attendance-report-summary", order: 131,
  access: { kind: "all", permissions: ["CanViewAttendanceReportUpload"] },
} satisfies ModuleManifest<"attendance", "/hr/attendance-report-summary">;
