import type { ModuleManifest } from "../contract";
export const manifest = {
  id: "store-services",
  label: "Services",
  root: "/extrals/services",
  order: 146,
  access: { kind: "all", permissions: ["CanViewServices"] },
} satisfies ModuleManifest<"store-services", "/extrals/services">;
