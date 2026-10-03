import type { ModuleManifest } from "../contract";
export const manifest = { id: "shift-categories", label: "Shift categories", root: "/settings/shift-categories", order: 91,
  access: { kind: "all", permissions: ["CanViewShiftCategories"] },
} satisfies ModuleManifest<"shift-categories", "/settings/shift-categories">;
