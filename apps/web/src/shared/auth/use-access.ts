import { useMemo } from "react";
import { allowsRequirement, canAccess, type AccessRule, type PermissionRequirement } from "./access";
import { useSession } from "./session-provider";

/** Permission checks for the signed-in user. Hides what the server would refuse; it does not replace the server check. */
export function useAccess() {
  const { accessContext: context, allowsNow } = useSession();
  return useMemo(() => {
    return {
      context,
      can: (rule: AccessRule) => canAccess(rule, context),
      has: (permission: string) => canAccess({ kind: "all", permissions: [permission] }, context),
      allows: (requirement: PermissionRequirement) => allowsRequirement(requirement, context),
      allowsNow,
    };
  }, [context, allowsNow]);
}
