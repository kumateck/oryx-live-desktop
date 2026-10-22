import type { ModuleManifest } from "../contract";
export const manifest = {
  id: "performance-cycles",
  label: "Performance cycles",
  root: "/hr/performance-cycles",
  order: 138,
  access: { kind: "all", permissions: ["CanViewPerformanceCycles"] },
} satisfies ModuleManifest<"performance-cycles", "/hr/performance-cycles">;
