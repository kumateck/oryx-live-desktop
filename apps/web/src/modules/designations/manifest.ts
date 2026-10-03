import type { ModuleManifest } from "../contract";
export const manifest = { id: "designations", label: "Designation management", root: "/hr/designation-management", order: 120,
  access: { kind: "all", permissions: ["CanViewDesignation"] },
} satisfies ModuleManifest<"designations", "/hr/designation-management">;
