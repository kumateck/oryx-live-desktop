/** Department types as the backend numbers them. */
export type DepartmentType = 0 | 1 | 2;
export const departmentTypes = { production: 0, nonProduction: 1, researchAndDevelopment: 2 } as const;

interface RuleBase {
  /** When set, the user's department must also be of this type. */
  readonly departmentType?: DepartmentType;
}

export type AccessRule =
  | ({ readonly kind: "authenticated" } & RuleBase)
  | ({ readonly kind: "all"; readonly permissions: readonly string[] } & RuleBase)
  | ({ readonly kind: "some"; readonly permissions: readonly string[] } & RuleBase)
  /**
   * Only the named accounts, matched on the signed-in user's email ignoring case. For the rare page the
   * business restricts to a person rather than a permission; the backend enforces the same list.
   */
  | ({ readonly kind: "account"; readonly emails: readonly string[] } & RuleBase);

export type PermissionRequirement = string | AccessRule;

export function requirementRule(requirement: PermissionRequirement): AccessRule {
  return typeof requirement === "string" ? { kind: "all", permissions: [requirement] } : requirement;
}

export function allowsRequirement(requirement: PermissionRequirement, context: AccessContext): boolean {
  return canAccess(requirementRule(requirement), context);
}

export type AccessContext =
  | { readonly state: "anonymous" }
  | { readonly state: "authenticated"; readonly permissions: ReadonlySet<string>; readonly departmentType?: DepartmentType | null; readonly email?: string | null };

/** Shared route, navigation, and action policy. The backend remains the authority for every request. */
export function canAccess(rule: AccessRule, context: AccessContext): boolean {
  if (context.state === "anonymous") return false;
  if (rule.departmentType !== undefined && context.departmentType !== rule.departmentType) return false;
  if (rule.kind === "authenticated") return true;
  if (rule.kind === "account") {
    const email = context.email?.toLowerCase();
    return Boolean(email) && rule.emails.some((allowed) => allowed.toLowerCase() === email);
  }
  if (rule.permissions.length === 0) return false;
  if (rule.kind === "all") return rule.permissions.every((key) => context.permissions.has(key));
  return rule.permissions.some((key) => context.permissions.has(key));
}
