import type { ModuleManifest } from "../contract";
export const manifest = {
  id: "shift-planning",
  label: "Plan shift",
  root: "/plan-shift",
  order: 141,
  access: { kind: "all", permissions: ["CanViewShiftSchedule"] },
} satisfies ModuleManifest<"shift-planning", "/plan-shift">;
