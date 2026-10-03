import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "permissions",
  label: "Permissions",
  root: "/access-management/permissions",
  order: 23,
  access: { kind: "all", permissions: ["CanViewPermissions"] },
} satisfies ModuleManifest<"permissions", "/access-management/permissions">;
