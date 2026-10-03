import type { ModuleManifest } from "../contract";
export const manifest = { id: "sites", label: "Sites", root: "/settings/sites", order: 82,
  access: { kind: "all", permissions: ["CanViewSite"] },
} satisfies ModuleManifest<"sites", "/settings/sites">;
