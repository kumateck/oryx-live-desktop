import type { ModuleManifest } from "../contract";
export const manifest = { id: "change-password", label: "Change password", root: "/settings/change-password", order: 84,
  access: { kind: "all", permissions: ["CanViewChangePassword"] },
} satisfies ModuleManifest<"change-password", "/settings/change-password">;
