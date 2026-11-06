import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);

/** The shelf attached to this particular stock allocation, never another shelf holding the same batch. */
export const stockShelfSchema = z.object({
  name: text, code: text,
  warehouseLocationRack: z.object({ name: text }).nullish(),
}).nullish();

export function rackShelfLocation(rack: string | null | undefined, shelf: string | null | undefined): string | null {
  const rackName = rack?.trim();
  const shelfName = shelf?.trim();
  if (!rackName && !shelfName) return null;
  return `${rackName || "Rack not recorded"} (${shelfName || "Shelf not recorded"})`;
}

type ShelfLocationData = {
  name?: string | null | undefined;
  code?: string | null | undefined;
  warehouseLocationRack?: { name?: string | null | undefined } | null | undefined;
};

export function stockShelfLocation(shelf: ShelfLocationData | null | undefined): string | null {
  return rackShelfLocation(shelf?.warehouseLocationRack?.name, shelf?.name || shelf?.code);
}

export const missingStockLocation = "Location not recorded";
