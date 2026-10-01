import { useMemo } from "react";
import { canAccess, type AccessContext, type AccessRule } from "./access";
import { useSession } from "./session-provider";

/** Permission checks for the signed-in user. Hides what the server would refuse; it does not replace the server check. */
export function useAccess() {
  const { state } = useSession();
  const permissions = state.status === "authenticated" ? state.session.permissions : null;
  return useMemo(() => {
    const context: AccessContext = permissions
      ? { state: "authenticated", permissions: new Set(permissions) } : { state: "anonymous" };
    return {
      context,
      can: (rule: AccessRule) => canAccess(rule, context),
      has: (permission: string) => canAccess({ kind: "all", permissions: [permission] }, context),
    };
  }, [permissions]);
}
