import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "racks",
  label: "Racks",
  root: "/settings/racks",
  order: 71,
  access: { kind: "all", permissions: ["CanViewRacks"] },
} satisfies ModuleManifest<"racks", "/settings/racks">;
