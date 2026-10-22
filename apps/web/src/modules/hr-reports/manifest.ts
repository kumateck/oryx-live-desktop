import type { ModuleManifest } from "../contract";
export const manifest = { id: "hr-reports", label: "HR reports", root: "/hr/human-resources-report", order: 130,
  access: { kind: "all", permissions: ["CanViewHumanResourcesReport"] },
} satisfies ModuleManifest<"hr-reports", "/hr/human-resources-report">;
