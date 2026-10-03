import type { ModuleManifest } from "../contract";

// The permissions are the ones the sidebar shows this dashboard for.
export const manifest = {
  id: "hr-executive-summary",
  label: "HR executive summary",
  root: "/hr-executive-summary",
  order: 102,
  access: { kind: "some", permissions: ["CanViewActiveEmployee"] },
} satisfies ModuleManifest<"hr-executive-summary", "/hr-executive-summary">;
