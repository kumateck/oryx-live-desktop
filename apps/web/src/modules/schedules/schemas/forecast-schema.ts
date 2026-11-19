import { z } from "zod";

const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const text = z.string().nullish().transform((value) => value?.trim() ?? "");

/** What a planned product needs of each material, against what the warehouse holds. */
export const forecastSchema = z.array(z.object({
  material: z.object({ id: z.string().nullish(), code: text, name: text, kind: z.number().nullish() }).nullish(),
  uoM: z.object({ symbol: text }).nullish(),
  quantityNeeded: amount, quantityOnHand: amount, expiredQuantity: amount, reservedQuantity: amount,
  // The store-stock rule's split (optional: older servers send only on hand, expired and reserved).
  unavailableQuantity: z.number().nullish(), usableQuantity: z.number().nullish(), freeQuantity: z.number().nullish(),
  isAvailable: z.boolean().nullish(),
  // A substitute production may use instead of its main material (optional: older servers list main materials only).
  isSubstitute: z.boolean().nullish(), substituteFor: z.object({ id: z.string().nullish(), code: text, name: text }).nullish(),
  substituteUnavailableReason: z.string().nullish(),
}).transform((item) => ({
  unusableReason: item.isSubstitute ? item.substituteUnavailableReason?.trim() || null : null,
  // A material can substitute on more than one line, so a substitute row is keyed by its main material too.
  id: `${item.material?.id ?? `${item.material?.code}:${item.material?.name}`}${item.isSubstitute ? `:for:${item.substituteFor?.id ?? item.substituteFor?.code ?? ""}` : ""}`,
  materialId: item.material?.id ?? null,
  substituteFor: item.isSubstitute && item.substituteFor ? { id: item.substituteFor.id ?? null, code: item.substituteFor.code, name: item.substituteFor.name || "its main material" } : null,
  code: item.material?.code ?? "", name: item.material?.name || "Unnamed material", kind: item.material?.kind ?? null, unit: item.uoM?.symbol || null,
  needed: item.quantityNeeded, onHand: item.quantityOnHand, expired: item.expiredQuantity, reserved: item.reservedQuantity, available: item.isAvailable ?? null,
  unavailable: item.unavailableQuantity ?? 0, usable: item.usableQuantity ?? null, free: item.freeQuantity ?? null,
}))).nullish().transform((value) => value ?? []);
export type ForecastMaterial = z.infer<typeof forecastSchema>[number];
