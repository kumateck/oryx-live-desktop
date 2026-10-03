import type { ModuleManifest } from "../contract";
export const manifest = { id: "shift-types", label: "Shift types", root: "/settings/shift-types", order: 90,
  access: { kind: "all", permissions: ["CanViewShiftTypes"] },
} satisfies ModuleManifest<"shift-types", "/settings/shift-types">;
