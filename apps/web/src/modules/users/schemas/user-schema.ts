import { z } from "zod";
import { sameOriginAvatar } from "@/shared/auth/session-api";

const text = z.string().nullish().transform((value) => value?.trim() ?? "");

const roleSchema = z.object({
  id: z.uuid(),
  name: text,
  displayName: text,
});

export const userRowSchema = z.object({
  id: z.uuid(),
  firstName: text,
  lastName: text,
  email: text,
  isDisabled: z.boolean().default(false),
  avatar: z.string().nullish().transform(sameOriginAvatar),
  createdAt: z.string().nullish().transform((value) => value ?? null),
  department: z.object({ name: text }).nullish().transform((value) => value?.name || null),
  roles: z.array(roleSchema).nullish().transform((value) => value ?? []),
}).transform((user) => ({
  ...user,
  name: `${user.firstName} ${user.lastName}`.trim() || user.email || "Unnamed user",
  // The backend allows one role per user.
  role: user.roles[0] ?? null,
}));

export const userListSchema = z.array(userRowSchema);
export type UserRow = z.infer<typeof userRowSchema>;

export const roleOptionSchema = z.array(z.object({ id: z.uuid(), name: z.string().min(1), displayName: text }))
  .transform((roles) => roles.map((role) => ({ id: role.id, name: role.name, label: role.displayName || role.name })));
export type RoleOption = z.infer<typeof roleOptionSchema>[number];

const option = (message: string) => z.object({ value: z.string().min(1, message), label: z.string() }, { message });

export const createUserSchema = z.object({
  employee: option("Choose an employee"),
  role: option("Choose a role"),
});
export type CreateUserValues = z.infer<typeof createUserSchema>;

export const employeeOptionSchema = z.object({
  id: z.uuid(),
  firstName: text,
  lastName: text,
  email: text,
  department: z.object({ name: text }).nullish().transform((value) => value?.name || null),
}).transform((employee) => ({
  id: employee.id,
  name: `${employee.firstName} ${employee.lastName}`.trim() || employee.email || "Unnamed employee",
  email: employee.email || null,
  department: employee.department,
}));
export type EmployeeOption = z.infer<typeof employeeOptionSchema>;
