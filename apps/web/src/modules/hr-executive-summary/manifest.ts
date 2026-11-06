import type { ModuleManifest } from "../contract";

// Each dashboard has its own view key, which the server checks too.
export const manifest = {
  id: "hr-executive-summary",
  label: "HR executive summary",
  root: "/hr-executive-summary",
  order: 102,
  access: { kind: "all", permissions: ["CanViewHrExecutiveSummary"] },
} satisfies ModuleManifest<"hr-executive-summary", "/hr-executive-summary">;
