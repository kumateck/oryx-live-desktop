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

/** The same rules as `newPasswordRule`, one per line, for a live checklist beside a password field. */
export const passwordRuleHints: readonly { readonly label: string; readonly met: (value: string) => boolean }[] = [
  { label: "At least 8 characters", met: (value) => value.length >= 8 },
  { label: "A digit (0-9)", met: (value) => /\d/.test(value) },
  { label: "A capital letter (A-Z)", met: (value) => /[A-Z]/.test(value) },
  { label: "A symbol, such as ! or #", met: (value) => /[^A-Za-z0-9]/.test(value) },
];

const passwordResponseSchema = z.object({ success: z.boolean(), errors: z.array(z.string()).nullish() });
/** The server answers 200 even when it refuses a password; only `success: true` means it changed. */
export function passwordFailure(result: DomainEntitiesAuthPasswordChangeResponse | undefined): string | null {
  const response = passwordResponseSchema.safeParse(result);
  if (response.success && response.data.success) return null;
  return response.success && response.data.errors?.filter(Boolean).join(" ") || "The server did not confirm the password change. Your password has not been confirmed as changed.";
}
