import type { ModuleManifest } from "../contract";

const either = (raw: string, packaging: string) => ({ kind: "some" as const, permissions: [raw, packaging] });
// Raw and packaging material analytical raw data: the worksheet template each material is tested on.
export const manifest = {
  id: "material-ards", label: "Material analytical raw data", root: "/qc/analytical-raw-data", order: 77,
  access: either("CanViewRawMaterialArds", "CanViewPackagingMaterialArds"),
  query: { key: "type", choices: [
    { value: "0", access: { kind: "all", permissions: ["CanViewRawMaterialArds"] } },
    { value: "1", access: { kind: "all", permissions: ["CanViewPackagingMaterialArds"] } },
  ] },
  routes: [{ pattern: "/qc/analytical-raw-data/:id", access: either("CanViewRawMaterialArds", "CanViewPackagingMaterialArds") }],
} satisfies ModuleManifest<"material-ards", "/qc/analytical-raw-data">;
