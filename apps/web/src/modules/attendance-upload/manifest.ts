import type { ModuleManifest } from "../contract";
export const manifest = { id: "attendance-upload", label: "Attendance upload", root: "/hr/attendance-report-upload", order: 132,
  access: { kind: "all", permissions: ["CanViewAttendanceReportUpload"] },
} satisfies ModuleManifest<"attendance-upload", "/hr/attendance-report-upload">;
