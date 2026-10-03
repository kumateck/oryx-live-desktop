import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);

export const storeRowsSchema = z.array(z.object({ id: z.string().nullish(), name: text, description: text, type: z.number().nullish(), locations: z.array(z.unknown()).nullish() })).nullish()
  .transform((value) => (value ?? []).flatMap((store) => store.id ? [{ id: store.id, name: store.name ?? "Unnamed store", description: store.description, type: store.type ?? 0, locations: store.locations?.length ?? 0 }] : []));
export type Store = z.infer<typeof storeRowsSchema>[number];

export const locationRowsSchema = z.array(z.object({ id: z.string().nullish(), name: text, floorName: text, description: text, racks: z.array(z.unknown()).nullish(),
  warehouse: z.object({ id: z.string().nullish(), name: text, type: z.number().nullish() }).nullish() })).nullish()
  .transform((value) => (value ?? []).flatMap((location) => location.id ? [{ id: location.id, name: location.name ?? "", floor: location.floorName ?? "", description: location.description,
    racks: location.racks?.length ?? 0, store: location.warehouse?.name ?? null, storeId: location.warehouse?.id ?? null, storeType: location.warehouse?.type ?? 0 }] : []));
export type StoreLocation = z.infer<typeof locationRowsSchema>[number];

const option = z.object({ value: z.string().min(1), label: z.string() });
const name = (what: string) => z.string().trim().min(1, `Enter the ${what}`).max(255, `Keep the ${what} under 255 characters`);
const description = z.string().trim().max(1000, "Keep the description under 1,000 characters").nullish();

export const storeFormSchema = z.object({ name: name("store name"), type: z.string().min(1, "Choose what the store is for"), description });
export type StoreFormValues = z.infer<typeof storeFormSchema>;

export const locationFormSchema = z.object({
  // Empty until chosen; checked on the field so its message shows with the others.
  store: option.nullable().refine((value): boolean => Boolean(value), "Choose the store"),
  floor: option.nullable().refine((value): boolean => Boolean(value), "Choose the floor"),
  // An area is picked from the house list where the store type has one, and typed otherwise.
  area: option.nullable(), name: z.string().trim().max(255, "Keep the name under 255 characters").nullish(), description,
});
export type LocationFormValues = z.infer<typeof locationFormSchema>;
