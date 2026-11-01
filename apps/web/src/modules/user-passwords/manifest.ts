import type { ModuleManifest } from "../contract";
import { passwordAdminAccess } from "../../shared/auth/password-admin";

// Limited to one account by the business, not by a permission key. The backend enforces the same account.
export const manifest = {
  id: "user-passwords",
  label: "Change user password",
  root: "/settings/user-passwords",
  order: 85,
  access: passwordAdminAccess,
} satisfies ModuleManifest<"user-passwords", "/settings/user-passwords">;
