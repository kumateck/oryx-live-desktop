import type { ModuleManifest } from "../contract";

const either = (raw: string, packaging: string) => ({ kind: "some" as const, permissions: [raw, packaging] });
const editOrCreate = { kind: "some" as const, permissions: ["CanCreateRawMaterialSpecification", "CanEditRawMaterialSpecification", "CanCreatePackagingMaterialSpecification", "CanEditPackagingMaterialSpecification"] };
// Raw and packaging material specifications: the template a material is tested on, and the pharmacopoeia reference for each test.
export const manifest = {
  id: "material-specifications", label: "Material specifications", root: "/qc/material-specification", order: 73,
  access: either("CanViewRawMaterialSpecifications", "CanViewPackagingMaterialSpecifications"),
  query: { key: "type", choices: [
    { value: "0", access: { kind: "all", permissions: ["CanViewRawMaterialSpecifications"] } },
    { value: "1", access: { kind: "all", permissions: ["CanViewPackagingMaterialSpecifications"] } },
  ] },
  routes: [
    { pattern: "/qc/material-specification/create", access: either("CanCreateRawMaterialSpecification", "CanCreatePackagingMaterialSpecification") },
    { pattern: "/qc/material-specification/:id/details", access: either("CanViewRawMaterialSpecifications", "CanViewPackagingMaterialSpecifications") },
    { pattern: "/qc/material-specification/:id/edit", access: either("CanEditRawMaterialSpecification", "CanEditPackagingMaterialSpecification") },
    { pattern: "/qc/material-specification/:id/complete", access: editOrCreate },
  ],
} satisfies ModuleManifest<"material-specifications", "/qc/material-specification">;
