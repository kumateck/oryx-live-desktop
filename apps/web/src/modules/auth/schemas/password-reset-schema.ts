import { z } from "zod";
import { newPasswordRule } from "@/shared/auth/password-rules";

export const forgotPasswordSchema = z.object({ email: z.email("Enter a valid email address") });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({ password: newPasswordRule, confirmPassword: z.string().min(1, "Confirm the new password") })
  .refine((values) => values.password === values.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

/**
 * The reset key from the address, or from a link pasted from the email: the app may be open on another
 * computer, or in the installed app, than the one the email link opens in.
 */
export function resetKey(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;
  let key = text;
  if (/[?&]key=/.test(text)) { try { key = new URL(text, "http://link.invalid").searchParams.get("key") ?? ""; } catch { return null; } }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key) ? key : null;
}
