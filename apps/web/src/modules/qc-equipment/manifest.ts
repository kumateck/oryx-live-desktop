import type { ModuleManifest } from "../contract";
export const manifest = { id: "qc-equipment", label: "QC equipment", root: "/settings/qc-equipments", order: 88,
  access: { kind: "all", permissions: ["CanViewQcEquipment"] },
} satisfies ModuleManifest<"qc-equipment", "/settings/qc-equipments">;
