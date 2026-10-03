import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);

/** The department's racks of one kind, each with its shelves: what a rack or a destination shelf is chosen from. */
export const rackSummarySchema = z.array(z.object({
  id: z.string().nullish(), name: text, warehouseLocation: z.object({ name: text }).nullish(),
  shelves: z.array(z.object({ id: z.string().nullish(), code: text, name: text })).nullish(),
})).nullish().transform((value) => (value ?? []).flatMap((rack) => rack.id ? [{
  id: rack.id, label: [rack.warehouseLocation?.name, rack.name ?? "Unnamed rack"].filter(Boolean).join(" · "),
  shelves: (rack.shelves ?? []).flatMap((shelf) => shelf.id ? [{ id: shelf.id, label: shelf.code ?? shelf.name ?? "Unnamed shelf" }] : []),
}] : []));
export type RackSummary = z.infer<typeof rackSummarySchema>[number];

/** One rack with what is on each of its shelves. */
export const rackSchema = z.object({
  id: z.string().min(1), name: text, warehouseLocation: z.object({ name: text, floorName: text }).nullish(),
  shelves: z.array(z.object({
    id: z.string().nullish(), code: text, name: text,
    materialBatches: z.array(z.object({
      id: z.string().nullish(), quantity: amount, uoM: z.object({ id: z.string().nullish(), symbol: text }).nullish(),
      materialBatch: z.object({ batchNumber: text, manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish(), retestDate: z.string().nullish(),
        uoM: z.object({ id: z.string().nullish(), symbol: text }).nullish(), material: z.object({ code: text, name: text }).nullish() }).nullish(),
    })).nullish(),
  })).nullish(),
}).transform((rack) => ({
  id: rack.id, name: rack.name ?? "Unnamed rack", location: rack.warehouseLocation?.name ?? null, floor: rack.warehouseLocation?.floorName ?? null,
  shelves: (rack.shelves ?? []).map((shelf, shelfIndex) => ({
    id: shelf.id ?? `shelf-${shelfIndex}`, shelfId: shelf.id ?? null, label: shelf.code ?? shelf.name ?? "Unnamed shelf",
    stock: (shelf.materialBatches ?? []).filter((item) => item.quantity > 0).map((item, index) => {
      const unit = item.uoM ?? item.materialBatch?.uoM;
      return { id: item.id ?? `stock-${shelfIndex}-${index}`, shelfBatchId: item.id ?? null, quantity: item.quantity, unit: unit?.symbol ?? null, unitId: unit?.id ?? null,
        batchNumber: item.materialBatch?.batchNumber ?? null, materialName: item.materialBatch?.material?.name ?? "Unnamed material", materialCode: item.materialBatch?.material?.code ?? null,
        manufacturingDate: item.materialBatch?.manufacturingDate ?? null, expiryDate: item.materialBatch?.expiryDate ?? null, retestDate: item.materialBatch?.retestDate ?? null };
    }),
  })),
}));
export type Rack = z.infer<typeof rackSchema>;
export type ShelfStock = Rack["shelves"][number]["stock"][number];

const option = z.object({ value: z.string().min(1), label: z.string() });
export const moveStockFormSchema = z.object({ moves: z.array(z.object({
  quantity: z.number({ message: "Enter the quantity" }).finite("Enter the quantity").positive("The quantity must be above zero"),
  // Empty until chosen; checked on the field so its message shows with the others.
  rack: option.nullable().refine((value): boolean => Boolean(value), "Choose a rack"),
  shelf: option.nullable().refine((value): boolean => Boolean(value), "Choose a shelf"),
  note: z.string().trim().nullish(),
})).min(1, "Add at least one destination") });
export type MoveStockFormValues = z.infer<typeof moveStockFormSchema>;
