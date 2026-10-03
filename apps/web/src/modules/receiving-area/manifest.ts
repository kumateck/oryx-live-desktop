import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "receiving-area",
  label: "Receiving area",
  root: "/warehouse/receiving-area",
  order: 57,
  access: { kind: "some", permissions: ["CanViewRawMaterialsItems", "CanViewPackagingMaterialsItems"] },
  routes: [{ pattern: "/warehouse/receiving-area/:id/create-checklist", access: { kind: "some", permissions: ["CanCreateChecklistForRawMaterials", "CanCreateChecklistForPackagingMaterials"] } }],
} satisfies ModuleManifest<"receiving-area", "/warehouse/receiving-area">;
