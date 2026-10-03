import { z } from "zod";
import type { SupplierContact } from "./supplier-summary";

const text = z.string().nullish().transform((value) => value?.trim() || null);

/** The supplier as the procurement lists carry it: who to write to and the currency they quote in. */
export const supplierContactSchema = z.object({
  id: z.string().nullish(), name: text, email: text, contactPerson: text, contactNumber: text, address: text, type: z.number().nullish(),
  country: z.object({ name: text, code: text }).nullish(), currency: z.object({ id: z.string().nullish(), symbol: text, name: text }).nullish(),
}).nullish().transform((value): SupplierContact & { id: string | null; currencyId: string | null; currencyName: string | null; address: string | null; countryCode: string | null; type: 0 | 1 | null } => ({
  id: value?.id ?? null, name: value?.name ?? "Unnamed supplier", email: value?.email ?? null, contactPerson: value?.contactPerson ?? null, contactNumber: value?.contactNumber ?? null,
  country: value?.country?.name ?? null, currency: value?.currency?.symbol ?? value?.currency?.name ?? null, currencyId: value?.currency?.id ?? null,
  currencyName: value?.currency?.name ?? null, address: value?.address ?? null, countryCode: value?.country?.code ?? null, type: value?.type === 0 || value?.type === 1 ? value.type : null,
}));
export type SupplierRecord = z.infer<typeof supplierContactSchema>;
