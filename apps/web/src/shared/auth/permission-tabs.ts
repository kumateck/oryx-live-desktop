import type { QueryAccess } from "../../modules/contract.ts";

/** Preserve the domain's choice order and exact backend keys. */
export function permissionTabs(permissions: Readonly<Record<string, string>>, key = "type"): QueryAccess {
  return { key, choices: Object.entries(permissions).map(([value, permission]) => ({ value, access: { kind: "all", permissions: [permission] } })) };
}
