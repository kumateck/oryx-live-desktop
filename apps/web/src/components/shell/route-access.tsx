import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { modules } from "../../modules/registry";
import { resolveQueryAccess, routeAccessPolicy } from "../../modules/registry-model";
import { NoAccess } from "../../shared/auth/no-access";
import { useAccess } from "../../shared/auth/use-access";
import { useSession } from "../../shared/auth/session-provider";
import { SessionGate } from "../../shared/auth/session-gate";

/** Applies each module's declared route access before its page renders or requests data. */
export function RouteAccess({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { state } = useSession();
  const { can, context } = useAccess();
  if (state.status !== "authenticated") return <SessionGate>{children}</SessionGate>;
  const policy = routeAccessPolicy(modules, location.pathname);
  if (!policy || !can(policy.access)) return <NoAccess />;
  if (policy.query) {
    const decision = resolveQueryAccess(policy.query, location.search, context);
    if (decision.state === "denied") return <NoAccess />;
    if (decision.state === "redirect") return <Navigate replace to={{ pathname: location.pathname, search: decision.search, hash: location.hash }} />;
  }
  return children;
}
