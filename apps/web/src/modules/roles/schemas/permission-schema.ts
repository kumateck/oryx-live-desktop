import { z } from "zod";

const permissionDetailSchema = z.object({
  key: z.string().min(1),
  name: z.string().nullish().transform((value) => value ?? null),
  description: z.string().nullish().transform((value) => value ?? null),
  subModule: z.string().nullish().transform((value) => value ?? null),
  hasOptions: z.boolean().default(false),
  types: z.array(z.string()).nullish().transform((types) => types ?? []),
});

export const permissionCatalogSchema = z.array(z.object({
  module: z.string().min(1),
  isActive: z.boolean().default(false),
  children: z.array(permissionDetailSchema).default([]),
}));

export type PermissionModule = z.infer<typeof permissionCatalogSchema>[number];
