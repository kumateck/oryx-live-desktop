export type AccessRule =
  | { readonly kind: "authenticated" }
  | { readonly kind: "all"; readonly permissions: readonly string[] }
  | { readonly kind: "some"; readonly permissions: readonly string[] };

export type AccessContext =
  | { readonly state: "anonymous" }
  | { readonly state: "authenticated"; readonly permissions: ReadonlySet<string> };

/** Navigation and route visibility only. The backend remains the authority for every action. */
export function canAccess(rule: AccessRule, context: AccessContext): boolean {
  if (context.state === "anonymous") return false;
  if (rule.kind === "authenticated") return true;
  if (rule.permissions.length === 0) return false;
  if (rule.kind === "all") return rule.permissions.every((key) => context.permissions.has(key));
  return rule.permissions.some((key) => context.permissions.has(key));
}
