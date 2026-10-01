import { useAccess } from "@/shared/auth/use-access";
import { rolePermissions } from "../lib/permissions";

export function useRoleAccess() {
  const { has } = useAccess();
  return {
    view: has(rolePermissions.view),
    create: has(rolePermissions.create),
    edit: has(rolePermissions.edit),
    delete: has(rolePermissions.delete),
    updatePermissions: has(rolePermissions.updatePermissions),
  };
}
