import type { ModuleManifest } from "../contract";
export const manifest = { id: "equipment", label: "Equipment", root: "/settings/equipments", order: 87,
  access: { kind: "all", permissions: ["CanViewEquipment"] },
} satisfies ModuleManifest<"equipment", "/settings/equipments">;
