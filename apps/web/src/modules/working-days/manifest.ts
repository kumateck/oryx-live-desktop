import type { ModuleManifest } from "../contract";
export const manifest = { id: "working-days", label: "Working days", root: "/settings/working-days", order: 85,
  access: { kind: "all", permissions: ["CanViewWorkingDays"] },
} satisfies ModuleManifest<"working-days", "/settings/working-days">;
