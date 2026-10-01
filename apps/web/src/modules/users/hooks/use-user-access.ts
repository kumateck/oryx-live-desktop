import { useAccess } from "@/shared/auth/use-access";
import { userPermissions } from "../lib/user-access";

export function useUserAccess() {
  const { has } = useAccess();
  return {
    viewActive: has(userPermissions.viewActive),
    viewInactive: has(userPermissions.viewInactive),
    create: has(userPermissions.create),
    edit: has(userPermissions.edit),
    block: has(userPermissions.block),
    unblock: has(userPermissions.unblock),
  };
}

export type UserAccess = ReturnType<typeof useUserAccess>;
