import { z } from "zod";
import type { DecisionEvidence } from "../api/decision-evidence";
const stock = z.object({ requisitionType: z.literal(0), items: z.array(z.object({ material: z.object({ kind: z.union([z.literal(0), z.literal(1)]) }) })).min(1) });
export const isProductionStockDocument = (type: string) => ["StockRequisition", "RawStockRequisition", "PackageStockRequisition"].includes(type);
/** The reviewed document determines the material kind; a URL label never supplies authority. */
export function stockRejectionKind(evidence: DecisionEvidence | null | undefined): 0 | 1 | null {
  for (const entry of evidence?.entries ?? []) {
    const parsed = stock.safeParse(entry.data);
    if (!parsed.success) continue;
    const kinds = new Set(parsed.data.items.map(item => item.material.kind));
    return kinds.size === 1 ? parsed.data.items[0]?.material.kind ?? null : null;
  }
  return null;
}
