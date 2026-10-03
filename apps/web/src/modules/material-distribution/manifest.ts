import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "material-distribution",
  label: "Material distribution",
  root: "/procurement/material-distribution",
  order: 56,
  access: { kind: "all", permissions: ["CanViewMaterialDistribution"] },
} satisfies ModuleManifest<"material-distribution", "/procurement/material-distribution">;
