import type { AccessRule } from "./access.ts";

/**
 * The only account that may set other users' passwords. The backend checks the same address against the
 * signed-in user's stored email (UserPasswordAdminRepository.PasswordAdminEmail); change both together.
 */
export const passwordAdminEmail = "dkadusei@kumateck.com";

export const passwordAdminAccess = { kind: "account", emails: [passwordAdminEmail] } as const satisfies AccessRule;
