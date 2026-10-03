import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "shelves",
  label: "Shelves",
  root: "/settings/shelves",
  order: 72,
  access: { kind: "all", permissions: ["CanViewShelves"] },
} satisfies ModuleManifest<"shelves", "/settings/shelves">;
