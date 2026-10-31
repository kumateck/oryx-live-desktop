import { z } from "zod";
import { newPasswordRule } from "@/shared/auth/password-rules";

const text = z.string().nullish().transform((value) => value?.trim() ?? "");

/** A user as the users list returns it, reduced to what the picker shows. */
export const pickableUserSchema = z.object({ id: z.uuid(), firstName: text, lastName: text, email: text })
  .transform((user) => ({ id: user.id, label: `${`${user.firstName} ${user.lastName}`.trim() || "Unnamed user"}${user.email ? ` · ${user.email}` : ""}` }));

/** Passwords are never trimmed: spaces are part of what the user typed. */
export const userPasswordSchema = z.object({
  user: z.object({ value: z.uuid(), label: z.string() }, { message: "Choose a user" }).nullable()
    .refine((user) => user !== null, "Choose a user"),
  newPassword: newPasswordRule,
  confirmPassword: z.string().min(1, "Confirm the new password"),
}).superRefine((values, context) => {
  if (values.newPassword !== values.confirmPassword) context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" });
});

export type UserPasswordValues = z.input<typeof userPasswordSchema>;
export const emptyUserPassword: UserPasswordValues = { user: null, newPassword: "", confirmPassword: "" };
