import type { ModuleManifest } from "../contract";

const view = { kind: "all", permissions: ["CanViewRoles"] } as const;

export const manifest = {
  id: "roles",
  label: "Roles",
  root: "/access-management/roles",
  order: 20,
  access: view,
  routes: [
    { pattern: "/access-management/roles/create", access: { kind: "all", permissions: ["CanCreateRole"] } },
    { pattern: "/access-management/roles/:id", access: view },
  ],
} satisfies ModuleManifest<"roles", "/access-management/roles">;
