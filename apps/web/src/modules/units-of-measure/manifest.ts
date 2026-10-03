import type { ModuleManifest } from "../contract";
export const manifest = { id: "units-of-measure", label: "Units of measure", root: "/settings/uom", order: 84,
  access: { kind: "all", permissions: ["CanViewUnitOfMeasure"] },
} satisfies ModuleManifest<"units-of-measure", "/settings/uom">;
