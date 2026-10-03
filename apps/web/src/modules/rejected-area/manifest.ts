import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "rejected-area",
  label: "Rejected area",
  root: "/warehouse/rejected-area",
  order: 63,
  access: { kind: "some", permissions: ["CanViewRejectedRawMaterials", "CanViewRejectedPackagingMaterials"] },
} satisfies ModuleManifest<"rejected-area", "/warehouse/rejected-area">;
