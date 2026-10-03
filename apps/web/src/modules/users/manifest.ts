import type { ModuleManifest } from "../contract";
import { permissionTabs } from "../../shared/auth/permission-tabs";
import { userPermissions } from "./lib/user-access";

export const manifest = {
  query: permissionTabs({ 0: userPermissions.viewActive, 1: userPermissions.viewInactive }, "status"),
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
