import { Skeleton } from "@/shared/skeleton/skeleton";
import { formatQuantityNumber, toLargestUnit, type QuantityOrigin } from "@/shared/units/quantity";
import { useMaterialUnit } from "../hooks/use-material-unit";
import type { MaterialUnit, MaterialUnitAudit } from "../lib/material-unit";

export function MaterialQuantity({ materialId, known = null, audit, value, origin }: {
  materialId: string; known?: MaterialUnit | null; audit: MaterialUnitAudit; value: number | null; origin: QuantityOrigin;
}) {
  const linked = useMaterialUnit(materialId, known, audit);
  if (value === null) return <span>–</span>;
  if (linked.status === "loading") return <Skeleton className="h-4 w-20" />;
  if (linked.status === "error") return <span>{formatQuantityNumber(value, origin)} <button type="button" className="text-destructive underline" onClick={linked.retry}>Retry unit</button></span>;
  if (!linked.unit) return <span>{formatQuantityNumber(value, origin)} <span className="text-destructive">(unit not set)</span></span>;
  return <span className="tabular-nums">{toLargestUnit(value, linked.unit.symbol, origin)?.text ?? "–"}</span>;
}
