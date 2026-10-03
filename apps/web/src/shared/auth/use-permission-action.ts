import { useAccess } from "./use-access";
import type { PermissionRequirement } from "./access";

export const permissionDeniedMessage = "Your access has changed. You do not have permission for this action.";

/** Check immediately before a side effect, again after asynchronous validation if needed. */
export function usePermissionAction(require: PermissionRequirement) {
  const { allows, allowsNow } = useAccess();
  return {
    allowed: allows(require),
    check: () => allowsNow(require) ? null : permissionDeniedMessage,
  };
}
