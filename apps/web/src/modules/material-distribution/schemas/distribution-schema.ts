import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const currency = z.object({ symbol: text }).nullish();

const source = z.object({ quantity: amount, shipmentInvoiceItem: z.object({ expectedQuantity: amount, receivedQuantity: amount, price: z.number().nullish(), priceUoM: text, uoM: z.object({ symbol: text }).nullish(),
  material: z.object({ code: text }).nullish(), manufacturer: z.object({ name: text }).nullish(), purchaseOrder: z.object({ code: text, currency }).nullish(),
  currency, shipmentInvoice: z.object({ supplier: z.object({ currency }).nullish() }).nullish() }).nullish() });
const section = z.object({
  material: z.object({ id: z.string().nullish(), name: text, code: text, kind: z.number().nullish(), description: text }).nullish(), totalQuantity: amount, uoM: z.object({ symbol: text }).nullish(),
  items: z.array(z.object({ department: z.object({ id: z.string().nullish(), name: text, code: text, description: text }).nullish(),
    requisitionItem: z.object({ id: z.string().nullish(), status: z.number().nullish(), quantity: z.number().nullish(), uoM: z.object({ symbol: text }).nullish() }).nullish(),
    quantityRequested: amount, quantityAllocated: amount, quantityRemaining: amount, distributions: z.array(source).nullish() })).nullish(),
});

/** What arrived of each material, how the server shares it between the departments that asked for it, and which invoice lines it came on. */
export const distributionSchema = z.object({ sections: z.array(section).nullish() }).nullish().transform((value) => (value?.sections ?? []).flatMap((entry) => {
  if (!entry.material?.id) return [];
  const unit = entry.uoM?.symbol ?? entry.items?.[0]?.requisitionItem?.uoM?.symbol ?? null;
  return [{ materialId: entry.material.id, materialName: entry.material.name ?? "Unnamed material", materialCode: entry.material.code, materialKind: entry.material.kind === 1 ? 1 as const : entry.material.kind === 0 ? 0 as const : null,
    materialDescription: entry.material.description, arrived: entry.totalQuantity, unit,
    shares: (entry.items ?? []).map((item, index) => ({ key: item.requisitionItem?.id ?? `share-${index}`, departmentId: item.department?.id ?? null, department: item.department?.name ?? "Department not recorded",
      departmentCode: item.department?.code ?? null, departmentDescription: item.department?.description ?? null,
      requested: item.quantityRequested, allocated: item.quantityAllocated, remaining: item.quantityRemaining,
      // What the department first asked for on its requisition, and where that request stands.
      asked: typeof item.requisitionItem?.quantity === "number" ? item.requisitionItem.quantity : null, askedUnit: item.requisitionItem?.uoM?.symbol ?? unit, requestStatus: item.requisitionItem?.status ?? null,
      sources: (item.distributions ?? []).map((entry2, position) => { const line = entry2.shipmentInvoiceItem;
        return { key: `source-${position}`, quantity: entry2.quantity, unit: line?.uoM?.symbol ?? unit, materialCode: line?.material?.code ?? null, manufacturer: line?.manufacturer?.name ?? null, order: line?.purchaseOrder?.code ?? null,
          price: typeof line?.price === "number" ? line.price : null, priceUnit: line?.priceUoM ?? null, currency: line?.currency?.symbol ?? line?.shipmentInvoice?.supplier?.currency?.symbol ?? line?.purchaseOrder?.currency?.symbol ?? null,
          expected: line?.expectedQuantity ?? 0, received: line?.receivedQuantity ?? 0 }; }) })) }];
}));
export type DistributionSection = z.infer<typeof distributionSchema>[number];
export type DistributionShare = DistributionSection["shares"][number];
