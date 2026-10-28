import { z } from "zod";
import { serviceSchema } from "@/shared/services/contracts";
const reference = z.object({ id: z.uuid(), name: z.string().nullish() });
export const providerRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  address: z.string(),
  email: z.string(),
  phone: z.string(),
  country: reference.nullish(),
  currency: reference.nullish(),
  createdAt: z.string().nullish(),
});
export const providerSchema = providerRowSchema.extend({ services: z.array(serviceSchema) });
export type Provider = z.infer<typeof providerSchema>;
export type ProviderRow = z.infer<typeof providerRowSchema>;
const option = z.object({ value: z.uuid(), label: z.string() });
export const providerEditorSchema = z
  .object({
    name: z.string().trim().min(3).max(1000),
    address: z.string().trim().min(1).max(10000),
    email: z.email().max(100),
    phone: z
      .string()
      .trim()
      .min(5)
      .max(100)
      .regex(/^\+?[0-9 ()-]+$/, "Use a valid telephone number."),
    country: option.nullable(),
    currency: option.nullable(),
    services: z.array(option).min(1, "Choose at least one service."),
  })
  .superRefine((v, c) => {
    for (const name of ["country", "currency"] as const) if (!v[name]) c.addIssue({ code: "custom", path: [name], message: "This field is required." });
    if (new Set(v.services.map((r) => r.value)).size !== v.services.length)
      c.addIssue({ code: "custom", path: ["services"], message: "Select each service once." });
  });
export type ProviderValues = z.infer<typeof providerEditorSchema>;
export const providerDefaults = (row: Provider | null): ProviderValues => ({
  name: row?.name ?? "",
  address: row?.address ?? "",
  email: row?.email ?? "",
  phone: row?.phone ?? "",
  country: row?.country ? { value: row.country.id, label: row.country.name ?? row.country.id } : null,
  currency: row?.currency ? { value: row.currency.id, label: row.currency.name ?? row.currency.id } : null,
  services: row?.services.map((s) => ({ value: s.id, label: s.name })) ?? [],
});
export const providerAudit = { module: "Services", subModule: "Contractors" };
