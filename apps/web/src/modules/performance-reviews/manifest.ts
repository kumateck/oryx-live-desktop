import type { ModuleManifest } from "../contract";
export const manifest = {
  id: "performance-reviews",
  label: "Performance reviews",
  root: "/hr/performance-reviews",
  order: 140,
  access: { kind: "all", permissions: ["CanViewPerformanceReviews"] },
} satisfies ModuleManifest<"performance-reviews", "/hr/performance-reviews">;
