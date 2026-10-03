import type { ModuleManifest } from "../contract";
export const manifest = { id: "code-settings", label: "Code settings", root: "/settings/code-settings", order: 89,
  access: { kind: "all", permissions: ["CanViewCodeSettings"] },
} satisfies ModuleManifest<"code-settings", "/settings/code-settings">;
