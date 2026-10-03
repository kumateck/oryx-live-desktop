import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "quarantine-area",
  label: "Quarantine area",
  root: "/warehouse/quarantine-area",
  order: 58,
  access: { kind: "some", permissions: ["CanViewQuarantineRawMaterials", "CanViewQuarantinePackagingMaterials"] },
} satisfies ModuleManifest<"quarantine-area", "/warehouse/quarantine-area">;
