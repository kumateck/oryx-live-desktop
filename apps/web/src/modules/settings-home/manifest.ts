import type { ModuleManifest } from "../contract";
// The landing page of the settings area. Each settings page keeps its own permission; this page only lists the ones a user holds.
export const manifest = { id: "settings-home", label: "System configuration", root: "/settings", order: 60,
  access: { kind: "authenticated" },
  routes: [
    { pattern: "/settings/account", access: { kind: "authenticated" } },
    { pattern: "/settings/appearance", access: { kind: "authenticated" } },
  ],
} satisfies ModuleManifest<"settings-home", "/settings">;
