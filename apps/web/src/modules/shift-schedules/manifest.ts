import type { ModuleManifest } from "../contract";
export const manifest = { id: "shift-schedules", label: "Shift schedule", root: "/settings/shift-schedule", order: 92,
  access: { kind: "all", permissions: ["CanViewShiftSchedule"] },
} satisfies ModuleManifest<"shift-schedules", "/settings/shift-schedule">;
