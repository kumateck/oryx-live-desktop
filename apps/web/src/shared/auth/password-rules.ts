import { z } from "zod";
import type { DomainEntitiesAuthPasswordChangeResponse } from "@/shared/api/generated/auth";

/**
 * A new password as the server's identity settings require it: at least 8 characters with a digit, a capital
 * letter and a symbol. Checked here too so the user hears it before the request; the server stays the judge.
 * Passwords are never trimmed.
 */
export const newPasswordRule = z.string().min(8, "Use at least 8 characters")
  .refine((value) => /\d/.test(value), "Include a digit")
  .refine((value) => /[A-Z]/.test(value), "Include a capital letter")
  .refine((value) => /[^A-Za-z0-9]/.test(value), "Include a symbol, such as ! or #");

const passwordResponseSchema = z.object({ success: z.boolean(), errors: z.array(z.string()).nullish() });
/** The server answers 200 even when it refuses a password; only `success: true` means it changed. */
export function passwordFailure(result: DomainEntitiesAuthPasswordChangeResponse | undefined): string | null {
  const response = passwordResponseSchema.safeParse(result);
  if (response.success && response.data.success) return null;
  return response.success && response.data.errors?.filter(Boolean).join(" ") || "The server did not confirm the password change. Your password has not been confirmed as changed.";
}
