import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const productionFloor = 3;

/** What one store or production floor holds of a material. */
export const warehouseStockSchema = z.array(z.object({ warehouse: z.object({ id: z.string().nullish(), name: text, type: z.number().nullish() }).nullish(), stockQuantity: amount, expiredQuantity: amount }))
  .nullish().transform((value) => (value ?? []).map((entry, index) => ({ id: entry.warehouse?.id ?? `store-${index}`, name: entry.warehouse?.name ?? "Unnamed store",
    onFloor: entry.warehouse?.type === productionFloor, total: entry.stockQuantity, expired: entry.expiredQuantity, usable: Math.max(entry.stockQuantity - entry.expiredQuantity, 0) })));
export type WarehouseStock = z.infer<typeof warehouseStockSchema>[number];

export const pipelineStages = ["Purchase requisition", "Supplier sourcing", "Quotation", "Purchase order", "Shipment", "At port", "Cleared", "In transit", "Arrived", "Warehouse receiving", "Quality check", "GRN generated"] as const;

/** A quantity of a material on its way in, and how far it has got. */
export const pipelineSchema = z.array(z.object({ id: z.string().nullish(), reference: text, stage: z.number().nullish(), status: text, quantity: amount, uom: z.object({ symbol: text }).nullish(),
  route: z.number().nullish(), supplierName: text, expectedAvailabilityDate: z.string().nullish(), lastUpdatedAt: z.string().nullish(), departments: z.array(z.string()).nullish() }))
  .nullish().transform((value) => (value ?? []).map((entry, index) => ({ id: `${entry.stage ?? "x"}:${entry.id ?? entry.reference ?? index}`, reference: entry.reference, stage: pipelineStages[entry.stage ?? -1] ?? "In the pipeline",
    status: entry.status, quantity: entry.quantity, unit: entry.uom?.symbol ?? null, route: entry.route === 0 ? "Foreign" : entry.route === 1 ? "Local" : null, supplier: entry.supplierName,
    expected: entry.expectedAvailabilityDate ?? null, updated: entry.lastUpdatedAt ?? null, departments: entry.departments ?? [] })));
export type PipelineRow = z.infer<typeof pipelineSchema>[number];

export const departmentOptionsSchema = z.array(z.object({ id: z.string().nullish(), name: text })).nullish()
  .transform((value) => (value ?? []).flatMap((entry) => entry.id ? [{ value: entry.id, label: entry.name ?? "Unnamed department" }] : []));

const option = z.object({ value: z.string().min(1), label: z.string() });
export const stockTransferFormSchema = z.object({
  code: z.string().trim().min(1, "Enter the request number"),
  reason: z.string().trim().max(1000, "Keep the reason under 1,000 characters").nullish(),
  sources: z.array(z.object({
    quantity: z.number({ message: "Enter the quantity" }).finite("Enter the quantity").positive("The quantity must be above zero"),
    unit: option,
    // Empty until chosen; checked on the field so its message shows with the others.
    department: option.nullable().refine((value): boolean => Boolean(value), "Choose the department"),
  })).min(1, "Add at least one department"),
});
export type StockTransferFormValues = z.infer<typeof stockTransferFormSchema>;
