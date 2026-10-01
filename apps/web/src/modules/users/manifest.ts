import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "users",
  label: "Users",
  root: "/access-management/users",
  order: 21,
  // The list has an active and an inactive tab, each with its own permission.
  access: { kind: "some", permissions: ["CanViewActiveUser", "CanViewInactiveUser"] },
  routes: [
    { pattern: "/access-management/users/create", access: { kind: "all", permissions: ["CanCreateUser"] } },
  ],
} satisfies ModuleManifest<"users", "/access-management/users">;
