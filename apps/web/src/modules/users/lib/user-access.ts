/** Same address as Oryx Next, so links and bookmarks carry over. */
export const usersPath = "/access-management/users";

export const userPermissions = {
  viewActive: "CanViewActiveUser",
  viewInactive: "CanViewInactiveUser",
  create: "CanCreateUser",
  edit: "CanEditUser",
  block: "CanBlockUser",
  unblock: "CanUnblockUser",
} as const;

export const audit = { module: "User Management", subModule: "Manage Users Directory" } as const;

export type UserStatus = "active" | "inactive";

// Oryx Next addresses the tabs as ?status=0 (active) and ?status=1 (inactive).
const statusParam: Record<UserStatus, string> = { active: "0", inactive: "1" };

export function statusFromParam(value: string | null): UserStatus {
  return value === statusParam.inactive ? "inactive" : "active";
}

export function statusToParam(status: UserStatus): string {
  return statusParam[status];
}

/** Tabs the user may open, in display order. */
export function allowedStatuses(access: { viewActive: boolean; viewInactive: boolean }): UserStatus[] {
  return [...(access.viewActive ? ["active" as const] : []), ...(access.viewInactive ? ["inactive" as const] : [])];
}

/** The requested tab when permitted, otherwise the first permitted one; null when neither is. */
export function resolveStatus(requested: UserStatus, allowed: readonly UserStatus[]): UserStatus | null {
  return allowed.includes(requested) ? requested : allowed[0] ?? null;
}

/**
 * The list endpoint's `isActive` parameter filters on the account's disabled flag:
 * false returns enabled accounts, true returns blocked ones.
 */
export function disabledFilter(status: UserStatus): boolean {
  return status === "inactive";
}
