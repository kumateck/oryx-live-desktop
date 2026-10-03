import { z } from "zod";
import type { DomainEntitiesAuthPasswordChangeResponse } from "@/shared/api/generated/auth";
export const passwordSchema = z.object({ currentPassword: z.string().min(1, "Enter your current password"), newPassword: z.string().min(8, "Use at least 8 characters"), confirmNewPassword: z.string().min(1, "Confirm your new password") })
  .superRefine((values, context) => {
    if (values.newPassword !== values.confirmNewPassword) context.addIssue({ code: "custom", path: ["confirmNewPassword"], message: "Passwords do not match" });
    if (values.currentPassword === values.newPassword) context.addIssue({ code: "custom", path: ["newPassword"], message: "Choose a different password" });
  });
export type PasswordValues = z.infer<typeof passwordSchema>;
export const emptyPasswords: PasswordValues = { currentPassword: "", newPassword: "", confirmNewPassword: "" };
const passwordResponseSchema = z.object({ success: z.boolean(), errors: z.array(z.string()).nullish() });
export function passwordFailure(result: DomainEntitiesAuthPasswordChangeResponse): string | null {
  const response = passwordResponseSchema.safeParse(result);
  if (response.success && response.data.success) return null;
  return response.success && response.data.errors?.filter(Boolean).join(" ") || "The server did not confirm the password change. Your password has not been confirmed as changed.";
}
