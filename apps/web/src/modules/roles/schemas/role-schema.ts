import { z } from "zod";

export const roleRowSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  displayName: z.string().min(1),
  type: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  isManager: z.boolean().default(false),
});

export const roleCreateSchema = z.object({
  name: z.string().trim().min(2, "Enter a role name"),
  type: z.object({ value: z.enum(["0", "1", "2"]), label: z.string() }),
});
export const roleEditSchema = roleCreateSchema.extend({
  displayName: z.string().trim().min(2, "Enter a display name"),
});

export type RoleRow = z.infer<typeof roleRowSchema>;
export type RoleCreateValues = z.infer<typeof roleCreateSchema>;
export type RoleEditValues = z.infer<typeof roleEditSchema>;
