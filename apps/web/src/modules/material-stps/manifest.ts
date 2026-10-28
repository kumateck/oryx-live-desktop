import type { ModuleManifest } from "../contract";

const either = (raw: string, packaging: string) => ({ kind: "some" as const, permissions: [raw, packaging] });
// Raw and packaging material standard test procedures and their controlled Word documents.
export const manifest = {
  id: "material-stps", label: "Material STPs", root: "/qc/material-stp", order: 75,
  access: either("CanViewRawMaterialStps", "CanViewPackagingMaterialStps"),
  query: { key: "type", choices: [
    { value: "0", access: { kind: "all", permissions: ["CanViewRawMaterialStps"] } },
    { value: "1", access: { kind: "all", permissions: ["CanViewPackagingMaterialStps"] } },
  ] },
  routes: [
    { pattern: "/qc/material-stp/:id", access: either("CanViewRawMaterialStps", "CanViewPackagingMaterialStps") },
    { pattern: "/qc/material-stp/:id/document", access: either("CanViewRawMaterialStps", "CanViewPackagingMaterialStps") },
  ],
} satisfies ModuleManifest<"material-stps", "/qc/material-stp">;
