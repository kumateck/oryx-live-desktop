import { z } from "zod";
import { Store } from "@/shared/inventory/stores";

export const damageRoot = "/extrals/damage-missing-items";
export const damageAudit = { module: "General Stores", subModule: "Damage/Missing Items" } as const;
export const DamageStatus = { Damage: 0, Missing: 1 } as const;
export const damageLabel = (status: number) => status === DamageStatus.Missing ? "Missing" : status === DamageStatus.Damage ? "Damaged" : `Unknown (${String(status)})`;

const text = z.string().nullish().transform((v) => v?.trim() || null);
export const damageSchema = z.object({
  id: z.string(), itemId: z.string(), quantityDamaged: z.number(), damageStatus: z.number(), remarks: text, createdAt: text,
  createdBy: z.object({ firstName: text, lastName: text, email: text }).nullish(),
  item: z.object({ name: text, code: text, store: z.enum(Store).nullish(), availableQuantity: z.number().catch(0), unitOfMeasure: z.object({ name: text, symbol: text }).nullish() }).nullish(),
}).transform((d) => ({
  id: d.id, itemId: d.itemId, quantity: d.quantityDamaged, status: d.damageStatus, remarks: d.remarks, createdAt: d.createdAt,
  reportedBy: d.createdBy ? [d.createdBy.firstName, d.createdBy.lastName].filter(Boolean).join(" ") || d.createdBy.email || null : null,
  itemName: d.item?.name ?? "Unnamed item", itemCode: d.item?.code ?? "–", store: d.item?.store ?? null, available: d.item?.availableQuantity ?? 0,
  unit: d.item?.unitOfMeasure?.symbol || d.item?.unitOfMeasure?.name || "",
}));
export type DamageRecord = z.infer<typeof damageSchema>;
export const damagePageSchema = z.object({ data: z.array(damageSchema).nullish().transform((d) => d ?? []), pageIndex: z.number().optional(), pageCount: z.number().optional(), totalRecordCount: z.number().optional() });

/** True when the record read just before a change is the one the user saw. */
export const sameDamage = (a: DamageRecord, b: DamageRecord) => a.quantity === b.quantity && a.status === b.status && a.itemId === b.itemId && (a.remarks ?? "") === (b.remarks ?? "");
