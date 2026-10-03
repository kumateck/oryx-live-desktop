import { z } from "zod";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { repeated } from "../lib/rack-rules";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const warehouse = z.object({ name: text, type: z.number().nullish() }).nullish();
const location = z.object({ id: z.string().nullish(), name: text, floorName: text, warehouse }).nullish();
const kindOf = (type: number | null | undefined): MaterialKind => type === 1 ? 1 : 0;

/** A rack as set up: where it stands and the shelves it has. */
export const storageRackRowsSchema = z.array(z.object({
  id: z.string().nullish(), name: text, description: text, warehouseLocation: location,
  shelves: z.array(z.object({ id: z.string().nullish(), code: text, name: text, description: text,
    materialBatches: z.array(z.object({ quantity: z.number().nullish() })).nullish() })).nullish(),
})).nullish().transform((value) => (value ?? []).flatMap((rack) => rack.id ? [{
  id: rack.id, name: rack.name ?? "Unnamed rack", description: rack.description,
  location: rack.warehouseLocation?.name ?? null, floor: rack.warehouseLocation?.floorName ?? null, warehouse: rack.warehouseLocation?.warehouse?.name ?? null,
  shelves: (rack.shelves ?? []).map((shelf, index) => ({ id: shelf.id ?? `shelf-${index}`, code: shelf.code ?? "", name: shelf.name ?? "", description: shelf.description ?? "",
    // Every record counts, even one emptied by a move: it still points at this shelf.
    stockRecords: shelf.materialBatches?.length ?? 0, inStock: (shelf.materialBatches ?? []).some((record) => (record.quantity ?? 0) > 0) })),
}] : []));
export type StorageRack = z.infer<typeof storageRackRowsSchema>[number];

/** A place in a store where racks stand. */
export const storageLocationsSchema = z.array(z.object({ id: z.string().nullish(), name: text, floorName: text, warehouse, racks: z.array(z.object({ name: text })).nullish() })).nullish()
  .transform((value) => (value ?? []).flatMap((entry) => entry.id ? [{ id: entry.id, name: entry.name ?? "Unnamed location", floor: entry.floorName, warehouse: entry.warehouse?.name ?? null,
    kind: kindOf(entry.warehouse?.type), rackNames: (entry.racks ?? []).flatMap((rack) => rack.name ? [rack.name] : []) }] : []));
export type StorageLocation = z.infer<typeof storageLocationsSchema>[number];

/** A shelf as listed on its own page. */
export const storageShelfRowsSchema = z.array(z.object({ id: z.string().nullish(), code: text, name: text, description: text,
  warehouseLocationRack: z.object({ id: z.string().nullish(), name: text, warehouseLocation: location }).nullish() })).nullish()
  .transform((value) => (value ?? []).flatMap((shelf) => shelf.id ? [{ id: shelf.id, code: shelf.code ?? "", name: shelf.name ?? "", description: shelf.description ?? "",
    rackId: shelf.warehouseLocationRack?.id ?? null, rack: shelf.warehouseLocationRack?.name ?? null, location: shelf.warehouseLocationRack?.warehouseLocation?.name ?? null,
    warehouse: shelf.warehouseLocationRack?.warehouseLocation?.warehouse?.name ?? null }] : []));
export type StorageShelf = z.infer<typeof storageShelfRowsSchema>[number];

/** Whether one shelf holds stock, read when it is about to be removed. */
export const shelfStockSchema = z.object({ materialBatches: z.array(z.object({ quantity: z.number().nullish() })).nullish() })
  .transform((value) => ({ inStock: (value.materialBatches ?? []).some((record) => (record.quantity ?? 0) > 0), stockRecords: value.materialBatches?.length ?? 0 }));

const option = z.object({ value: z.string().min(1), label: z.string() });
const name = (what: string) => z.string().trim().min(1, `Enter the ${what}`).max(255, `Keep the ${what} under 255 characters`);
const description = z.string().trim().max(1000, "Keep the description under 1,000 characters").nullish();
const shelfFields = { code: name("shelf code"), name: name("shelf name"), description };

export const rackFormSchema = z.object({
  // Empty until chosen; checked on the field so its message shows with the others.
  location: option.nullable().refine((value): boolean => Boolean(value), "Choose the location"),
  name: name("rack name"), description,
  shelves: z.array(z.object(shelfFields)).superRefine((shelves, context) => {
    const names = repeated(shelves.map((shelf) => shelf.name));
    const codes = repeated(shelves.map((shelf) => shelf.code));
    shelves.forEach((shelf, index) => {
      if (names.has(shelf.name.trim().toLowerCase())) context.addIssue({ code: "custom", path: [index, "name"], message: "Another shelf on this rack has this name" });
      if (codes.has(shelf.code.trim().toLowerCase())) context.addIssue({ code: "custom", path: [index, "code"], message: "Another shelf on this rack has this code" });
    });
  }),
});
export type RackFormValues = z.infer<typeof rackFormSchema>;

export const shelfFormSchema = z.object({ rack: option.nullable().refine((value): boolean => Boolean(value), "Choose the rack"), ...shelfFields });
export type ShelfFormValues = z.infer<typeof shelfFormSchema>;
