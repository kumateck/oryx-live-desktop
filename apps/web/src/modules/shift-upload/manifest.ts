import type { ModuleManifest } from "../contract";
export const manifest = {
  id: "shift-upload",
  label: "Shift schedule upload",
  root: "/hr/shift-schedule-upload",
  order: 142,
  access: { kind: "all", permissions: ["CanViewShiftScheduleReportUpload"] },
} satisfies ModuleManifest<"shift-upload", "/hr/shift-schedule-upload">;
