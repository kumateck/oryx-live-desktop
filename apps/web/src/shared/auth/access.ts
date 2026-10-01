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
  | ({ readonly kind: "some"; readonly permissions: readonly string[] } & RuleBase);

export type AccessContext =
  | { readonly state: "anonymous" }
  | { readonly state: "authenticated"; readonly permissions: ReadonlySet<string>; readonly departmentType?: DepartmentType | null };

/** Navigation and route visibility only. The backend remains the authority for every action. */
export function canAccess(rule: AccessRule, context: AccessContext): boolean {
  if (context.state === "anonymous") return false;
  if (rule.departmentType !== undefined && context.departmentType !== rule.departmentType) return false;
  if (rule.kind === "authenticated") return true;
  if (rule.permissions.length === 0) return false;
  if (rule.kind === "all") return rule.permissions.every((key) => context.permissions.has(key));
  return rule.permissions.some((key) => context.permissions.has(key));
}
