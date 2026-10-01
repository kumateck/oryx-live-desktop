import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { modules } from "../../modules/registry";
import { routeAccessRule } from "../../modules/registry-model";
import { NoAccess } from "../../shared/auth/no-access";
import { useAccess } from "../../shared/auth/use-access";

/** Applies each module's declared route access before its page renders or requests data. */
export function RouteAccess({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { can } = useAccess();
  const rule = routeAccessRule(modules, pathname);
  return !rule || can(rule) ? children : <NoAccess />;
}
