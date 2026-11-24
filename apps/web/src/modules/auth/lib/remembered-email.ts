import { loginSchema } from "../schemas/login-schema";

const key = "oryx.login.email";

/** A local email preference, independent of the authenticated session. */
export function rememberedEmail(): string {
  try {
    const value = localStorage.getItem(key);
    const parsed = loginSchema.shape.email.safeParse(value);
    return parsed.success ? parsed.data : "";
  } catch { return ""; }
}

export function rememberEmail(email: string, enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(key, email.trim());
    else localStorage.removeItem(key);
  } catch { /* An unavailable preference store must not prevent sign-in. */ }
}
