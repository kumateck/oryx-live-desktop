import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "material-returns",
  label: "Material returns",
  root: "/warehouse/material-returns",
  order: 66,
  access: { kind: "all", permissions: ["CanViewMaterialsReturnNote"] },
} satisfies ModuleManifest<"material-returns", "/warehouse/material-returns">;
