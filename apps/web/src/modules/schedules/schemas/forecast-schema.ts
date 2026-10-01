import { z } from "zod";

const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const text = z.string().nullish().transform((value) => value?.trim() ?? "");

/** What a planned product needs of each material, against what the warehouse holds. */
export const forecastSchema = z.array(z.object({
  material: z.object({ id: z.string().nullish(), code: text, name: text, kind: z.number().nullish() }).nullish(),
  uoM: z.object({ symbol: text }).nullish(),
  quantityNeeded: amount, quantityOnHand: amount, expiredQuantity: amount, reservedQuantity: amount,
  isAvailable: z.boolean().nullish(),
}).transform((item) => ({
  id: item.material?.id ?? `${item.material?.code}:${item.material?.name}`,
  code: item.material?.code ?? "", name: item.material?.name || "Unnamed material", kind: item.material?.kind ?? null, unit: item.uoM?.symbol || null,
  needed: item.quantityNeeded, onHand: item.quantityOnHand, expired: item.expiredQuantity, reserved: item.reservedQuantity, available: item.isAvailable ?? null,
}))).nullish().transform((value) => value ?? []);
export type ForecastMaterial = z.infer<typeof forecastSchema>[number];
