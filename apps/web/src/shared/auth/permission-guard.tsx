import type { ReactNode } from "react";
import type { PermissionRequirement } from "./access";
import { useAccess } from "./use-access";

interface PermissionGuardProps {
  /** One permission key, or a rule combining several. */
  require: PermissionRequirement;
  children: ReactNode;
  fallback?: ReactNode;
}

/** Renders an action or section only for users who hold the permission. */
export function PermissionGuard({ require, children, fallback = null }: PermissionGuardProps) {
  const access = useAccess();
  const allowed = access.allows(require);
  return allowed ? children : fallback;
}
