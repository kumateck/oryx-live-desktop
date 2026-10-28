import { z } from "zod";
import { Store } from "@/shared/inventory/stores";
export { Store, stores, itemReadPermissions, storeValue } from "@/shared/inventory/stores";
export const audit = { module: "General Stores", subModule: "Vendors" };
export const option = z.object({ value: z.uuid(), label: z.string() });
export const vendorSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  countryId: z.uuid(),
  currencyId: z.uuid(),
  contactPerson: z.string().nullish(),
  country: z.object({ id: z.uuid(), name: z.string() }).nullish(),
  currency: z.object({ id: z.uuid(), name: z.string(), symbol: z.string().nullish() }).nullish(),
  items: z.array(
    z.object({ item: z.object({ id: z.uuid(), name: z.string(), code: z.string().nullish(), store: z.enum(Store), isActive: z.boolean().nullish() }) }),
  ),
});
export type Vendor = z.infer<typeof vendorSchema>;
export const editorSchema = z
  .object({
    name: z.string().trim().min(3).max(200),
    address: z.string().trim().min(1).max(1000),
    phone: z
      .string()
      .trim()
      .min(5)
      .max(50)
      .regex(/^\+?[0-9 ()-]+$/, "Use a valid telephone number."),
    email: z.email().max(100),
    contactPerson: z.string().trim().min(1).max(150),
    country: option.nullable(),
    currency: option.nullable(),
    items: z.array(option).min(1, "Choose at least one vendor item."),
    store: z.object({ value: z.enum(["0", "1", "2", "3"]), label: z.string() }).nullable(),
  })
  .superRefine((v, c) => {
    for (const name of ["country", "currency"] as const) if (!v[name]) c.addIssue({ code: "custom", path: [name], message: "This field is required." });
    if (new Set(v.items.map((i) => i.value)).size !== v.items.length) c.addIssue({ code: "custom", path: ["items"], message: "Select each item only once." });
  });
export type VendorValues = z.infer<typeof editorSchema>;
export function defaults(row: Vendor | null): VendorValues {
  return {
    name: row?.name ?? "",
    address: row?.address ?? "",
    phone: row?.phone ?? "",
    email: row?.email ?? "",
    contactPerson: row?.contactPerson ?? "",
    country: row ? { value: row.countryId, label: row.country?.name ?? row.countryId } : null,
    currency: row ? { value: row.currencyId, label: row.currency?.name ?? row.currencyId } : null,
    items: row?.items.map((i) => ({ value: i.item.id, label: i.item.name })) ?? [],
    store: null,
  };
}
