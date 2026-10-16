import { z } from "zod";
import { newPasswordRule } from "@/shared/auth/password-rules";
export { passwordFailure } from "@/shared/auth/password-rules";
export const passwordSchema = z.object({ currentPassword: z.string().min(1, "Enter your current password"), newPassword: newPasswordRule, confirmNewPassword: z.string().min(1, "Confirm your new password") })
  .superRefine((values, context) => {
    if (values.newPassword !== values.confirmNewPassword) context.addIssue({ code: "custom", path: ["confirmNewPassword"], message: "Passwords do not match" });
    if (values.currentPassword === values.newPassword) context.addIssue({ code: "custom", path: ["newPassword"], message: "Choose a different password" });
  });
export type PasswordValues = z.infer<typeof passwordSchema>;
export const emptyPasswords: PasswordValues = { currentPassword: "", newPassword: "", confirmNewPassword: "" };
