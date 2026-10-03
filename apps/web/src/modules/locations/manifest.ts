import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "locations",
  label: "Locations",
  root: "/settings/locations",
  order: 70,
  access: { kind: "all", permissions: ["CanViewLocations"] },
} satisfies ModuleManifest<"locations", "/settings/locations">;
