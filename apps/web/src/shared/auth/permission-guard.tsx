import type { ReactNode } from "react";
import type { AccessRule } from "./access";
import { useAccess } from "./use-access";

interface PermissionGuardProps {
  /** One permission key, or a rule combining several. */
  require: string | AccessRule;
  children: ReactNode;
  fallback?: ReactNode;
}

/** Renders an action or section only for users who hold the permission. */
export function PermissionGuard({ require, children, fallback = null }: PermissionGuardProps) {
  const access = useAccess();
  const allowed = typeof require === "string" ? access.has(require) : access.can(require);
  return allowed ? children : fallback;
}
